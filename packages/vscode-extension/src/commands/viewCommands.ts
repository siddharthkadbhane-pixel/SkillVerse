import * as vscode from 'vscode';
import { AuthManager } from '../auth/manager';
import { SkillVerseApiClient } from '../api/client';
import { DCCWebviewPanel } from '../views/dccWebview';

export function registerViewCommands(
  context: vscode.ExtensionContext,
  refreshCallback: () => void
): void {
  // 1. View DCC Command (Webview Panel)
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.viewDCC', async () => {
      const session = await AuthManager.getInstance().getSession();
      if (!session.isAuthenticated) {
        const choice = await vscode.window.showWarningMessage('Login required to view your DCC.', 'Login');
        if (choice === 'Login') {
          vscode.commands.executeCommand('skillverse.login');
        }
        return;
      }

      try {
        const status = await SkillVerseApiClient.getInstance().getStatus();
        DCCWebviewPanel.render(status, context.extensionUri);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to load DCC: ${err.message}`);
      }
    })
  );

  // 2. View Skills Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.viewSkills', async () => {
      try {
        const status = await SkillVerseApiClient.getInstance().getStatus();
        const skills = status.dcc?.verifiedSkills || [];

        if (skills.length === 0) {
          vscode.window.showInformationMessage('No verified skills detected yet. Run repository analysis to verify skills.');
          return;
        }

        const items = skills.map((s) => ({
          label: `$(pass) ${s.name}`,
          description: `${s.level} • ${s.category}`,
          detail: `Verified with ${s.evidenceCount} repository proof(s)`,
        }));

        await vscode.window.showQuickPick(items, {
          placeHolder: `Verified Technical Skills (${skills.length})`,
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to load verified skills: ${err.message}`);
      }
    })
  );

  // 3. Open Dashboard Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.openDashboard', () => {
      const config = vscode.workspace.getConfiguration('skillverse');
      const baseUrl = config.get<string>('apiUrl', 'http://localhost:3000');
      vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/overview`));
    })
  );

  // 4. Open Public Profile Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.openProfile', async () => {
      const session = await AuthManager.getInstance().getSession();
      const username = session.user?.username || 'siddharthkadbhane-pixel';
      const config = vscode.workspace.getConfiguration('skillverse');
      const baseUrl = config.get<string>('apiUrl', 'http://localhost:3000');
      vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/developer/${username}`));
    })
  );

  // 5. Refresh Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.refresh', () => {
      refreshCallback();
      vscode.window.showInformationMessage('SkillVerse views refreshed.');
    })
  );
}
