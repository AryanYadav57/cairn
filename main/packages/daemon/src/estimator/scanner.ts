import fs from 'node:fs';
import path from 'node:path';
import type { RepoScanSummary } from '@cairn/core';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.cairn',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  'target',
  'vendor',
  '__pycache__',
  '.venv',
]);

const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.cs': 'C#',
  '.java': 'Java',
  '.cpp': 'C++',
  '.c': 'C',
  '.md': 'Markdown',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.sql': 'SQL',
  '.html': 'HTML',
  '.css': 'CSS',
};

export function scanRepository(repoPath: string): RepoScanSummary {
  const absRoot = path.resolve(repoPath);
  let totalFiles = 0;
  let totalLinesOfCode = 0;
  let hasTests = false;
  const languages: Record<string, number> = {};

  function walk(dir: string, depth: number): void {
    if (depth > 8 || totalFiles > 5000) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          walk(path.join(dir, entry.name), depth + 1);
        }
        continue;
      }

      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      const lang = EXT_TO_LANG[ext];
      if (!lang) continue;

      const fullPath = path.join(dir, entry.name);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }
      if (stat.size > 1_000_000) continue; // Skip huge generated bundles

      totalFiles++;
      languages[lang] = (languages[lang] ?? 0) + 1;

      if (/(\.test\.|\.spec\.|_test\.|test_)/i.test(entry.name)) {
        hasTests = true;
      }

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').length;
        totalLinesOfCode += lines;
      } catch {
        // Ignore binary or unreadable files
      }
    }
  }

  walk(absRoot, 0);

  // Compute brownfield complexity multiplier (1.0 for greenfield <1k LOC, up to 2.2 for >100k LOC)
  const rawFactor =
    totalLinesOfCode <= 1_000
      ? 1.0
      : 1.0 + Math.min(1.2, Math.log10(totalLinesOfCode / 1_000) * 0.45);
  const repoComplexityFactor = Number(rawFactor.toFixed(2));

  return {
    repoPath: absRoot,
    totalFiles,
    totalLinesOfCode,
    languages,
    hasTests,
    repoComplexityFactor,
  };
}
