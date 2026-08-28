import * as vscode from 'vscode';
import { AuthManager } from '../auth/manager';
import { SkillVerseApiClient } from '../api/client';
import { ExtensionLogger } from '../utils/logger';

export function registerAuthCommands(context: vscode.ExtensionContext): void {
  // 1. Login Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.login', async (presetToken?: string) => {
      try {
        let token = presetToken;

        if (!token) {
          const input = await vscode.window.showInputBox({
            title: 'SkillVerse Login',
            prompt: 'Enter your SkillVerse Personal Access Token, API Key, or type "demo" for test mode',
            placeHolder: 'sk_live_... or demo',
            password: true,
            ignoreFocusOut: true,
          });

          if (!input) return;
          token = input.trim();
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Authenticating with SkillVerse...',
            cancellable: false,
          },
          async () => {
            const res = await SkillVerseApiClient.getInstance().authenticate(token!);
            await AuthManager.getInstance().login(res.token, res.user);
            vscode.window.showInformationMessage(
              `Successfully connected to SkillVerse as @${res.user.username} (${res.dcc.overallScore} ${res.dcc.level})`
            );
          }
        );
      } catch (err: any) {
        ExtensionLogger.error('Login failed:', err);
        vscode.window.showErrorMessage(`SkillVerse authentication failed: ${err.message}`);
      }
    })
  );

  // 2. Logout Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.logout', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Are you sure you want to disconnect from SkillVerse?',
        { modal: true },
        'Disconnect'
      );

      if (confirm === 'Disconnect') {
        await AuthManager.getInstance().logout();
        vscode.window.showInformationMessage('Disconnected from SkillVerse');
      }
    })
  );
}
