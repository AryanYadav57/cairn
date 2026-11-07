import WebSocket from 'ws';

/**
 * Minimal VS Code Extension Host API surface so the extension compiles cleanly
 * in any environment while working natively inside Antigravity IDE, VS Code, Cursor, and Windsurf.
 */
export interface VsCodeApiSurface {
  window: {
    createStatusBarItem(alignment?: number, priority?: number): {
      text: string;
      tooltip: string;
      command: string;
      show(): void;
      dispose(): void;
    };
    showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
    createWebviewPanel(
      viewType: string,
      title: string,
      showOptions: number,
      options: { enableScripts: boolean }
    ): {
      webview: {
        html: string;
        onDidReceiveMessage(listener: (msg: Record<string, unknown>) => void): void;
      };
    };
  };
  commands: {
    registerCommand(command: string, callback: (...args: unknown[]) => unknown): { dispose(): void };
    executeCommand(command: string, ...args: unknown[]): Promise<unknown>;
  };
  workspace: {
    getConfiguration(section?: string): {
      update(key: string, value: unknown, global?: boolean): Promise<void>;
    };
  };
}

export class CairnExtensionController {
  private ws?: WebSocket;
  private statusBar: ReturnType<VsCodeApiSurface['window']['createStatusBarItem']>;

  constructor(
    private readonly vscode: VsCodeApiSurface,
    private readonly daemonUrl = 'http://localhost:4100'
  ) {
    this.statusBar = this.vscode.window.createStatusBarItem(1, 100);
    this.statusBar.text = '$(shield) Cairn: Connecting...';
    this.statusBar.tooltip = 'Click to open Cairn Control Plane, PRD Estimator & Mobile Remote Pairing';
    this.statusBar.command = 'cairn.openDashboard';
    this.statusBar.show();
  }

  public activate(): void {
    this.connectWebSocket();

    this.vscode.commands.registerCommand('cairn.openDashboard', async () => {
      await this.openDashboardWebview();
    });

    this.vscode.commands.registerCommand('cairn.estimateWorkspacePrd', async () => {
      try {
        const res = await fetch(`${this.daemonUrl}/api/estimate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          report?: {
            modelDisplayName: string;
            totals: { costUsd: { low: number; expected: number; high: number } };
          };
        };
        if (data.ok && data.report) {
          const c = data.report.totals.costUsd;
          await this.vscode.window.showInformationMessage(
            `Cairn PRD Forecast (${data.report.modelDisplayName}): $${c.low.toFixed(2)} – $${c.high.toFixed(
              2
            )} (Expected: $${c.expected.toFixed(2)})`
          );
        }
      } catch {
        await this.vscode.window.showWarningMessage(
          'Cairn Daemon is offline. Start it with `npm start` to estimate PRD costs.'
        );
      }
    });

    this.vscode.commands.registerCommand('cairn.undoLastStep', async () => {
      const res = await fetch(`${this.daemonUrl}/api/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { restored?: boolean; checkpoint?: { description: string }; error?: string };
      if (data.restored) {
        await this.vscode.window.showInformationMessage(
          `Cairn reverted working tree to snapshot: ${data.checkpoint?.description ?? 'latest'}`
        );
      } else {
        await this.vscode.window.showWarningMessage(`Cairn undo failed: ${data.error ?? 'Unknown error'}`);
      }
    });

    this.vscode.commands.registerCommand('cairn.configureAgentGateway', async () => {
      const cfg = this.vscode.workspace.getConfiguration();
      await cfg.update('http.proxySupport', 'override', true);
      await this.vscode.window.showInformationMessage(
        `Cairn Gateway ready! Set your agent's OpenAI Base URL to ${this.daemonUrl}/v1 or Anthropic Base URL to ${this.daemonUrl}`
      );
    });
  }

  private connectWebSocket(): void {
    const wsUrl = this.daemonUrl.replace(/^http/, 'ws') + '/ws';
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('message', async (raw) => {
        try {
          const msg = JSON.parse(String(raw)) as {
            type: string;
            payload: Record<string, unknown>;
          };

          if (msg.type === 'connected' || msg.type === 'call_recorded') {
            const spend = (msg.payload.spend ?? {}) as { projectUsd?: number };
            const usd = Number(spend.projectUsd ?? 0).toFixed(2);
            this.statusBar.text = `$(shield) Cairn: $${usd} | 📱 Remote Ready`;
          }

          if (msg.type === 'approval_required') {
            const act = msg.payload as { id: string; toolName: string; preview: string; riskLevel: string };
            const choice = await this.vscode.window.showWarningMessage(
              `[Cairn ${act.riskLevel.toUpperCase()} Risk] ${act.toolName}: ${act.preview}`,
              'Approve',
              'Reject'
            );
            if (choice) {
              this.ws?.send(
                JSON.stringify({
                  type: 'approve_action',
                  actionId: act.id,
                  decision: choice === 'Approve' ? 'approved' : 'rejected',
                  source: 'ide',
                })
              );
            }
          }

          // IDE-5: Execute native IDE command triggered remotely from the user's phone
          if (msg.type === 'ide_execute_command') {
            const cmd = String(msg.payload.command ?? '');
            const args = Array.isArray(msg.payload.args) ? msg.payload.args : [];
            if (cmd) {
              await this.vscode.commands.executeCommand(cmd, ...args);
            }
          }
        } catch {
          // Ignore parse errors
        }
      });

      this.ws.on('error', () => {
        this.statusBar.text = '$(warning) Cairn: Daemon Offline';
      });
    } catch {
      this.statusBar.text = '$(warning) Cairn: Daemon Offline';
    }
  }

  private async openDashboardWebview(): Promise<void> {
    const panel = this.vscode.window.createWebviewPanel(
      'cairnDashboard',
      'Cairn Control Plane & Mobile Remote',
      1,
      { enableScripts: true }
    );
    try {
      const res = await fetch(`${this.daemonUrl}/api/status`);
      const status = (await res.json()) as {
        spend: { projectUsd: number; dailyUsd: number; totalTokens: number };
        remotePairUrl: string;
      };
      panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 24px; background: #04060b; color: #f8fafc;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <img src="${this.daemonUrl}/brand/cairn-combined.png" alt="Cairn" style="height: 32px; width: auto;" />
            <span style="font-size: 18px; font-weight: 700; background: linear-gradient(108deg, #ffffff 12%, #60a5fa 56%, #0069fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Control Plane</span>
          </div>
          <p><strong>Project Spend:</strong> $${status.spend.projectUsd.toFixed(2)} (${status.spend.totalTokens.toLocaleString()} tokens)</p>
          <p><strong>Daily Spend:</strong> $${status.spend.dailyUsd.toFixed(2)}</p>
          <hr style="border-color: rgba(0, 105, 253, 0.35); margin: 16px 0;" />
          <h3>📱 Control Antigravity IDE / VS Code from Your Phone</h3>
          <p>Open this pairing URL on your phone (or scan in terminal):</p>
          <pre style="background: #0a101d; border: 1px solid rgba(0, 105, 253, 0.45); padding: 12px; border-radius: 6px; color: #60a5fa;">${status.remotePairUrl}</pre>
        </body>
        </html>
      `;
    } catch {
      panel.webview.html = `<html><body><h3>Cairn Daemon is not running. Run <code>npm start</code> to launch it.</h3></body></html>`;
    }
  }

  public dispose(): void {
    this.ws?.close();
    this.statusBar.dispose();
  }
}

let activeController: CairnExtensionController | undefined;

/**
 * Standard VS Code / Cursor / Antigravity Extension Host entry point.
 */
export async function activate(context?: {
  subscriptions?: Array<{ dispose(): unknown }>;
}): Promise<CairnExtensionController | undefined> {
  try {
    const vscodeModule = (await import('vscode' as string)) as VsCodeApiSurface;
    activeController = new CairnExtensionController(vscodeModule);
    activeController.activate();
    if (context?.subscriptions) {
      context.subscriptions.push(activeController);
    }
    return activeController;
  } catch {
    return undefined;
  }
}

export function deactivate(): void {
  activeController?.dispose();
  activeController = undefined;
}
