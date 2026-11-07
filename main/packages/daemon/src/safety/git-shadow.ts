import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CairnDatabase, StoredCheckpointRecord } from '../db/database.js';

export class GitShadowEngine {
  constructor(
    private readonly repoDir: string,
    private readonly db: CairnDatabase
  ) {}

  public isGitRepo(): boolean {
    try {
      execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
        cwd: this.repoDir,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  public ensureGitRepo(): boolean {
    if (this.isGitRepo()) return true;
    try {
      execFileSync('git', ['init'], { cwd: this.repoDir, stdio: 'ignore' });
      return this.isGitRepo();
    } catch {
      return false;
    }
  }

  public getCurrentBranch(): string | undefined {
    if (!this.isGitRepo()) return undefined;
    try {
      const out = execFileSync('git', ['branch', '--show-current'], {
        cwd: this.repoDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      return out || 'main';
    } catch {
      return undefined;
    }
  }

  /**
   * SAF-4: Creates an off-branch Git tree snapshot under refs/cairn/checkpoints/<runId>/<stepId>
   * using a temporary GIT_INDEX_FILE so the user's staged index and branch history are untouched.
   */
  public createShadowSnapshot(params: {
    runId: string;
    stepId: string;
    description: string;
  }): StoredCheckpointRecord | null {
    if (!this.ensureGitRepo()) {
      return null;
    }

    const tmpIndex = path.join(
      os.tmpdir(),
      `cairn-index-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    );

    try {
      const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };

      // Stage all working tree files into the temporary shadow index
      execFileSync('git', ['add', '-A'], { cwd: this.repoDir, env, stdio: 'ignore' });

      // Write the tree object to Git object store
      const treeHash = execFileSync('git', ['write-tree'], {
        cwd: this.repoDir,
        env,
        encoding: 'utf-8',
      }).trim();

      // Create a shadow commit object pointing to the tree so Git GC preserves it
      const commitHash = execFileSync(
        'git',
        ['commit-tree', treeHash, '-m', `Cairn shadow checkpoint: ${params.description}`],
        {
          cwd: this.repoDir,
          env: {
            ...env,
            GIT_AUTHOR_NAME: 'Cairn Safety Daemon',
            GIT_AUTHOR_EMAIL: 'cairn@local',
            GIT_COMMITTER_NAME: 'Cairn Safety Daemon',
            GIT_COMMITTER_EMAIL: 'cairn@local',
          },
          encoding: 'utf-8',
        }
      ).trim();

      const safeRun = params.runId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeStep = params.stepId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const gitRef = `refs/cairn/checkpoints/${safeRun}/${safeStep}`;

      execFileSync('git', ['update-ref', gitRef, commitHash], {
        cwd: this.repoDir,
        stdio: 'ignore',
      });

      return this.db.recordCheckpoint({
        id: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        runId: params.runId,
        stepId: params.stepId,
        gitTreeHash: treeHash,
        gitRef,
        description: params.description,
      });
    } catch {
      return null;
    } finally {
      try {
        if (fs.existsSync(tmpIndex)) {
          fs.unlinkSync(tmpIndex);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Restores the working directory to a specific shadow checkpoint (stepId or checkpoint id)
   * while preserving the user's staged Git index and cleaning up untracked files created after the snapshot.
   */
  public restoreShadowSnapshot(idOrStepId?: string): {
    restored: boolean;
    checkpoint?: StoredCheckpointRecord;
    cleanedFiles?: string[];
    error?: string;
  } {
    const checkpoints = this.db.listCheckpoints(50);
    const target = idOrStepId
      ? checkpoints.find((c) => c.id === idOrStepId || c.stepId === idOrStepId)
      : checkpoints.find((c) => c.reverted === 0);

    if (!target) {
      return { restored: false, error: 'No matching Git shadow checkpoint found' };
    }

    const gitDir = path.join(this.repoDir, '.git');
    const realIndexPath = path.join(gitDir, 'index');
    const indexBackupPath = path.join(
      os.tmpdir(),
      `cairn-idx-bak-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    );
    let hadRealIndex = false;

    try {
      if (fs.existsSync(realIndexPath)) {
        fs.copyFileSync(realIndexPath, indexBackupPath);
        hadRealIndex = true;
      }

      // 1. Determine which files existed in the snapshot tree
      const treeFilesRaw = execFileSync('git', ['ls-tree', '-r', '--name-only', target.gitTreeHash], {
        cwd: this.repoDir,
        encoding: 'utf-8',
      });
      const snapshotFiles = new Set(
        treeFilesRaw
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      );

      // 2. Find any current tracked or untracked (non-ignored) files created after the snapshot
      const currentFilesRaw = execFileSync(
        'git',
        ['ls-files', '--cached', '--others', '--exclude-standard'],
        {
          cwd: this.repoDir,
          encoding: 'utf-8',
        }
      );
      const currentFiles = currentFilesRaw
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      // 3. Checkout the snapshot tree into the working directory
      execFileSync('git', ['read-tree', '--reset', '-u', target.gitTreeHash], {
        cwd: this.repoDir,
        stdio: 'ignore',
      });

      // 4. Remove untracked files that were created after the snapshot was taken
      const cleanedFiles: string[] = [];
      for (const relFile of currentFiles) {
        if (!snapshotFiles.has(relFile)) {
          const fullPath = path.resolve(this.repoDir, relFile);
          if (fullPath.startsWith(path.resolve(this.repoDir)) && fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
              cleanedFiles.push(relFile);
            } catch {
              // Ignore locked file deletion errors
            }
          }
        }
      }

      // 5. Restore the user's original .git/index so untracked snapshot files don't stay staged
      if (hadRealIndex && fs.existsSync(indexBackupPath)) {
        fs.copyFileSync(indexBackupPath, realIndexPath);
      }

      this.db.markCheckpointReverted(target.id);
      return { restored: true, checkpoint: target, cleanedFiles };
    } catch (err) {
      return { restored: false, error: (err as Error).message };
    } finally {
      try {
        if (fs.existsSync(indexBackupPath)) {
          fs.unlinkSync(indexBackupPath);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Computes a unified Git diff between a shadow checkpoint and the current working directory
   * without mutating the user's index or working tree.
   */
  public getCheckpointDiff(idOrStepId?: string): {
    found: boolean;
    checkpoint?: StoredCheckpointRecord;
    changedFiles: string[];
    stat: string;
    diff: string;
    error?: string;
  } {
    if (!this.isGitRepo()) {
      return { found: false, changedFiles: [], stat: '', diff: '', error: 'Not a Git repository' };
    }

    const checkpoints = this.db.listCheckpoints(50);
    const target = idOrStepId
      ? checkpoints.find((c) => c.id === idOrStepId || c.stepId === idOrStepId)
      : checkpoints.find((c) => c.reverted === 0);

    if (!target) {
      return {
        found: false,
        changedFiles: [],
        stat: '',
        diff: '',
        error: 'No matching Git shadow checkpoint found',
      };
    }

    const tmpIndex = path.join(
      os.tmpdir(),
      `cairn-diff-idx-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    );

    try {
      const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };
      execFileSync('git', ['add', '-A'], { cwd: this.repoDir, env, stdio: 'ignore' });
      const currentTreeHash = execFileSync('git', ['write-tree'], {
        cwd: this.repoDir,
        env,
        encoding: 'utf-8',
      }).trim();

      const namesRaw = execFileSync(
        'git',
        ['diff', '--name-only', target.gitTreeHash, currentTreeHash],
        { cwd: this.repoDir, encoding: 'utf-8' }
      );
      const changedFiles = namesRaw
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      const stat = execFileSync('git', ['diff', '--stat', target.gitTreeHash, currentTreeHash], {
        cwd: this.repoDir,
        encoding: 'utf-8',
      }).trim();

      const diff = execFileSync('git', ['diff', target.gitTreeHash, currentTreeHash], {
        cwd: this.repoDir,
        encoding: 'utf-8',
        maxBuffer: 4 * 1024 * 1024,
      })
        .slice(0, 24000)
        .trim();

      return {
        found: true,
        checkpoint: target,
        changedFiles,
        stat,
        diff,
      };
    } catch (err) {
      return {
        found: false,
        checkpoint: target,
        changedFiles: [],
        stat: '',
        diff: '',
        error: (err as Error).message,
      };
    } finally {
      try {
        if (fs.existsSync(tmpIndex)) {
          fs.unlinkSync(tmpIndex);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
