import * as vscode from 'vscode';
import { AuthManager } from '../auth/manager';
import { SkillVerseApiClient } from '../api/client';
import { GitWorkspaceDetector } from '../utils/git';
import { ExtensionLogger } from '../utils/logger';

export function registerRepoCommands(context: vscode.ExtensionContext): void {
  // 1. Analyze Repository Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.analyzeRepo', async () => {
      const session = await AuthManager.getInstance().getSession();
      if (!session.isAuthenticated) {
        const loginChoice = await vscode.window.showWarningMessage(
          'You must be logged in to SkillVerse to analyze a repository.',
          'Login'
        );
        if (loginChoice === 'Login') {
          vscode.commands.executeCommand('skillverse.login');
        }
        return;
      }

      const repoMeta = await GitWorkspaceDetector.detectWorkspaceRepo();
      if (!repoMeta) {
        vscode.window.showErrorMessage('No Git repository detected in the open workspace.');
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `SkillVerse: Auditing repository ${repoMeta.fullName || repoMeta.name}...`,
          cancellable: false,
        },
        async (progress) => {
          try {
            progress.report({ message: 'Compiling AST manifests...' });
            await SkillVerseApiClient.getInstance().analyzeRepository(repoMeta.name, repoMeta.fullName);

            progress.report({ message: 'Running multi-agent analysis pipeline...' });
            // Small simulated delay to allow background worker to process
            await new Promise((r) => setTimeout(r, 1200));

            vscode.window.showInformationMessage(
              `Repository ${repoMeta.name} analyzed successfully! DCC capability dimensions updated.`
            );
            vscode.commands.executeCommand('skillverse.refresh');
          } catch (err: any) {
            ExtensionLogger.error('Repository analysis failed:', err);
            vscode.window.showErrorMessage(`SkillVerse analysis failed: ${err.message}`);
          }
        }
      );
    })
  );

  // 2. Verify Repository Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.verifyRepo', async () => {
      const repoMeta = await GitWorkspaceDetector.detectWorkspaceRepo();
      if (!repoMeta) {
        vscode.window.showErrorMessage('No workspace repository detected.');
        return;
      }

      try {
        const status = await SkillVerseApiClient.getInstance().getStatus(repoMeta.name);
        const repo = status.repository;

        if (repo && repo.verificationState === 'verified') {
          vscode.window.showInformationMessage(
            `Repository ${repo.name} is VERIFIED (Health: ${repo.healthScore}%, Quality Score: ${repo.overallScore}/1000)`
          );
        } else {
          vscode.window.showWarningMessage(
            `Repository ${repoMeta.name} is currently unverified. Run "SkillVerse: Analyze Repository" to verify.`
          );
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Verification status check failed: ${err.message}`);
      }
    })
  );
}
