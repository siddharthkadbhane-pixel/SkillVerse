import * as vscode from 'vscode';
import { AuthManager } from '../auth/manager';
import { SkillVerseApiClient } from '../api/client';
import { SkillVerseStatusData } from '../types';
import { ExtensionLogger } from '../utils/logger';

export class SkillVerseStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private currentStatus: SkillVerseStatusData | null = null;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'skillverse.statusBarClicked';
    this.renderDisconnected();
    this.statusBarItem.show();

    // Listen for auth state changes
    AuthManager.getInstance().onAuthStateChanged((session) => {
      if (session.isAuthenticated) {
        this.refresh();
      } else {
        this.currentStatus = null;
        this.renderDisconnected();
      }
    });
  }

  public renderDisconnected(): void {
    this.statusBarItem.text = '$(shield) SkillVerse: Connect';
    this.statusBarItem.tooltip = 'Click to login to SkillVerse and view your verified capabilities';
  }

  public renderConnected(status: SkillVerseStatusData): void {
    this.currentStatus = status;
    const score = status.dcc?.overallScore ?? 940;
    const level = status.dcc?.level ?? 'Elite';
    this.statusBarItem.text = `$(shield) SkillVerse: ${score} (${level})`;
    this.statusBarItem.tooltip = `SkillVerse DCC: ${score}/1000 (${level})\nVerified Developer: @${status.developer.username}\nClick for options`;
  }

  public async refresh(repoName?: string): Promise<void> {
    const session = await AuthManager.getInstance().getSession();
    if (!session.isAuthenticated) {
      this.renderDisconnected();
      return;
    }

    try {
      this.statusBarItem.text = '$(sync~spin) SkillVerse...';
      const status = await SkillVerseApiClient.getInstance().getStatus(repoName);
      this.renderConnected(status);
    } catch (err: any) {
      ExtensionLogger.warn('Failed to update status bar:', err);
      this.statusBarItem.text = '$(shield) SkillVerse: Active';
    }
  }

  public async showQuickPickMenu(): Promise<void> {
    const session = await AuthManager.getInstance().getSession();

    if (!session.isAuthenticated) {
      const choice = await vscode.window.showQuickPick(
        [
          { label: '$(sign-in) Login with SkillVerse Token', id: 'login' },
          { label: '$(key) Login with Demo Account', id: 'login_demo' },
          { label: '$(globe) Open SkillVerse Web App', id: 'dashboard' },
        ],
        { placeHolder: 'SkillVerse IDE Integration' }
      );

      if (choice?.id === 'login') {
        vscode.commands.executeCommand('skillverse.login');
      } else if (choice?.id === 'login_demo') {
        vscode.commands.executeCommand('skillverse.login', 'sk_demo_token');
      } else if (choice?.id === 'dashboard') {
        vscode.commands.executeCommand('skillverse.openDashboard');
      }
      return;
    }

    const items: vscode.QuickPickItem[] = [
      {
        label: `$(shield) View Developer Capability Card (${this.currentStatus?.dcc?.overallScore ?? 940} ${this.currentStatus?.dcc?.level ?? 'Elite'})`,
        detail: 'Open rich interactive DCC capability view in VS Code',
      },
      {
        label: '$(play) Analyze Active Repository',
        detail: 'Trigger multi-agent AST audit on current workspace',
      },
      {
        label: '$(code) View Verified Skills',
        detail: 'Inspect cryptographic evidence and skill ratings',
      },
      {
        label: '$(sparkle) Explain Active File',
        detail: 'Understand architectural structure and metrics',
      },
      {
        label: '$(search) Review Active File (AST)',
        detail: 'Audit current file against clean code practices',
      },
      {
        label: '$(globe) Open Web Dashboard',
        detail: 'Navigate to full SkillVerse web portal',
      },
      {
        label: '$(sign-out) Logout',
        detail: 'Clear stored credentials',
      },
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `SkillVerse — @${session.user?.username ?? 'developer'}`,
    });

    if (!selected) return;

    if (selected.label.includes('View Developer Capability Card')) {
      vscode.commands.executeCommand('skillverse.viewDCC');
    } else if (selected.label.includes('Analyze Active Repository')) {
      vscode.commands.executeCommand('skillverse.analyzeRepo');
    } else if (selected.label.includes('View Verified Skills')) {
      vscode.commands.executeCommand('skillverse.viewSkills');
    } else if (selected.label.includes('Explain Active File')) {
      vscode.commands.executeCommand('skillverse.explainFile');
    } else if (selected.label.includes('Review Active File')) {
      vscode.commands.executeCommand('skillverse.reviewFile');
    } else if (selected.label.includes('Open Web Dashboard')) {
      vscode.commands.executeCommand('skillverse.openDashboard');
    } else if (selected.label.includes('Logout')) {
      vscode.commands.executeCommand('skillverse.logout');
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
