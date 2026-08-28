import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface WorkspaceRepoMeta {
  name: string;
  fullName?: string;
  remoteUrl?: string;
  rootPath: string;
}

export class GitWorkspaceDetector {
  /**
   * Detects the primary repository in the open workspace folders
   */
  public static async detectWorkspaceRepo(): Promise<WorkspaceRepoMeta | null> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return null;
    }

    const rootFolder = folders[0];
    const rootPath = rootFolder.uri.fsPath;
    const folderName = rootFolder.name;

    // Check if .git exists in workspace root
    const gitDir = path.join(rootPath, '.git');
    const gitConfigPath = path.join(gitDir, 'config');

    let remoteUrl: string | undefined;
    let fullName: string | undefined;

    try {
      if (fs.existsSync(gitConfigPath)) {
        const configContent = fs.readFileSync(gitConfigPath, 'utf8');
        const match = configContent.match(/url\s*=\s*(.*)/i);
        if (match && match[1]) {
          remoteUrl = match[1].trim();
          
          // Parse github.com/owner/repo from remote URL
          const parsed = remoteUrl
            .replace(/^git@github\.com:/i, '')
            .replace(/^https?:\/\/github\.com\//i, '')
            .replace(/\.git$/i, '')
            .trim();

          if (parsed && parsed.includes('/')) {
            fullName = parsed;
          }
        }
      }
    } catch {
      // Ignored: fallback to workspace folder name
    }

    return {
      name: folderName,
      fullName: fullName || folderName,
      remoteUrl,
      rootPath,
    };
  }
}
