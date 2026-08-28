import * as vscode from 'vscode';
import { ExtensionLogger } from './utils/logger';
import { AuthManager } from './auth/manager';
import { SkillVerseStatusBar } from './status/statusBar';
import { DCCTreeProvider } from './providers/dccTreeProvider';
import { RepoTreeProvider } from './providers/repoTreeProvider';
import { registerAuthCommands } from './commands/authCommands';
import { registerRepoCommands } from './commands/repoCommands';
import { registerFileCommands } from './commands/fileCommands';
import { registerViewCommands } from './commands/viewCommands';
import { GitWorkspaceDetector } from './utils/git';

let statusBar: SkillVerseStatusBar | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // 1. Initialize Logger & Auth
  ExtensionLogger.initialize();
  ExtensionLogger.info('Activating SkillVerse VS Code Extension v1.0.0');

  const authManager = AuthManager.initialize(context);

  // 2. Initialize Status Bar
  statusBar = new SkillVerseStatusBar();
  context.subscriptions.push({ dispose: () => statusBar?.dispose() });

  // 3. Initialize Tree Data Providers for Activity Bar
  const dccProvider = new DCCTreeProvider();
  const repoProvider = new RepoTreeProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('skillverse-dcc-view', dccProvider),
    vscode.window.registerTreeDataProvider('skillverse-repo-view', repoProvider)
  );

  const refreshAll = async () => {
    dccProvider.refresh();
    repoProvider.refresh();
    const repoMeta = await GitWorkspaceDetector.detectWorkspaceRepo();
    await statusBar?.refresh(repoMeta?.name);
  };

  // 4. Register Command Handlers
  registerAuthCommands(context);
  registerRepoCommands(context);
  registerFileCommands(context);
  registerViewCommands(context, refreshAll);

  // Status Bar Click Action
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.statusBarClicked', async () => {
      await statusBar?.showQuickPickMenu();
    })
  );

  // 5. Initial Workspace Scan
  try {
    const session = await authManager.getSession();
    const repoMeta = await GitWorkspaceDetector.detectWorkspaceRepo();

    if (session.isAuthenticated) {
      ExtensionLogger.info(`Restored session for @${session.user?.username ?? 'developer'}`);
      await statusBar.refresh(repoMeta?.name);
    } else {
      statusBar.renderDisconnected();
    }
  } catch (err: any) {
    ExtensionLogger.warn('Error during initial workspace setup:', err);
  }

  ExtensionLogger.info('SkillVerse VS Code Extension activated successfully.');
}

export function deactivate(): void {
  ExtensionLogger.info('Deactivating SkillVerse VS Code Extension.');
  statusBar?.dispose();
}
