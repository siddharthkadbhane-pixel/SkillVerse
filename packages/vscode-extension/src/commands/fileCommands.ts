import * as vscode from 'vscode';
import { AuthManager } from '../auth/manager';
import { SkillVerseApiClient } from '../api/client';
import { ExtensionLogger } from '../utils/logger';

export function registerFileCommands(context: vscode.ExtensionContext): void {
  // 1. Explain File Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.explainFile', async () => {
      await handleFileInspection('explain');
    })
  );

  // 2. Review File (AST Heuristics) Command
  context.subscriptions.push(
    vscode.commands.registerCommand('skillverse.reviewFile', async () => {
      await handleFileInspection('review');
    })
  );
}

async function handleFileInspection(action: 'explain' | 'review'): Promise<void> {
  const session = await AuthManager.getInstance().getSession();
  if (!session.isAuthenticated) {
    const loginChoice = await vscode.window.showWarningMessage(
      'Login required to inspect code with SkillVerse.',
      'Login'
    );
    if (loginChoice === 'Login') {
      vscode.commands.executeCommand('skillverse.login');
    }
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('Open a code file in the editor to inspect it.');
    return;
  }

  const document = editor.document;
  const filePath = document.fileName;
  const language = document.languageId;
  const selectedText = editor.selection.isEmpty
    ? document.getText()
    : document.getText(editor.selection);

  if (!selectedText.trim()) {
    vscode.window.showWarningMessage('File is empty.');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `SkillVerse: Running AST ${action === 'review' ? 'Code Audit' : 'Architecture Analysis'} on ${document.fileName.split(/[\\\/]/).pop()}...`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await SkillVerseApiClient.getInstance().inspectFile({
          filePath,
          language,
          code: selectedText,
          action,
        });

        ExtensionLogger.show();
        ExtensionLogger.info('======================================================');
        ExtensionLogger.info(`SKILLVERSE FILE INSPECTION: ${result.fileName}`);
        ExtensionLogger.info(`Language: ${result.language} | Lines: ${result.lineCount} | Quality Score: ${result.score}/100`);
        ExtensionLogger.info(`Complexity: ${result.complexity}`);
        ExtensionLogger.info(`Summary: ${result.summary}`);
        ExtensionLogger.info('Insights:');
        result.insights.forEach((ins) => ExtensionLogger.info(`  ✓ ${ins}`));
        if (result.suggestions.length > 0) {
          ExtensionLogger.info('Actionable Suggestions:');
          result.suggestions.forEach((sug) => ExtensionLogger.info(`  💡 ${sug}`));
        }
        ExtensionLogger.info('======================================================\n');

        vscode.window.showInformationMessage(
          `SkillVerse ${action === 'review' ? 'Audit' : 'Summary'} for ${result.fileName}: Scored ${result.score}/100 (${result.complexity} complexity). See Output tab for full report.`
        );
      } catch (err: any) {
        ExtensionLogger.error('File inspection failed:', err);
        vscode.window.showErrorMessage(`SkillVerse file inspection failed: ${err.message}`);
      }
    }
  );
}
