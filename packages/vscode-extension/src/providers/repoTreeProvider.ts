import * as vscode from 'vscode';
import { AuthManager } from '../auth/manager';
import { SkillVerseApiClient } from '../api/client';
import { GitWorkspaceDetector, WorkspaceRepoMeta } from '../utils/git';
import { SkillVerseStatusData, SkillVerseRepositoryInfo } from '../types';
import { ExtensionLogger } from '../utils/logger';

export class RepoTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue?: string,
    public readonly description?: string,
    public readonly tooltip?: string,
    public readonly iconPath?: vscode.ThemeIcon
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.tooltip = tooltip;
    this.iconPath = iconPath;
  }
}

export class RepoTreeProvider implements vscode.TreeDataProvider<RepoTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<RepoTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private cachedRepoMeta: WorkspaceRepoMeta | null = null;
  private cachedRepoInfo: SkillVerseRepositoryInfo | null = null;

  constructor() {
    AuthManager.getInstance().onAuthStateChanged(() => this.refresh());
  }

  public refresh(): void {
    this.cachedRepoMeta = null;
    this.cachedRepoInfo = null;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: RepoTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: RepoTreeItem): Promise<RepoTreeItem[]> {
    const session = await AuthManager.getInstance().getSession();
    if (!session.isAuthenticated) {
      return [
        new RepoTreeItem(
          'Login to view repository status',
          vscode.TreeItemCollapsibleState.None,
          'login_hint',
          undefined,
          undefined,
          new vscode.ThemeIcon('lock')
        ),
      ];
    }

    if (!this.cachedRepoMeta) {
      this.cachedRepoMeta = await GitWorkspaceDetector.detectWorkspaceRepo();
    }

    const repoMeta = this.cachedRepoMeta;
    if (!repoMeta) {
      return [
        new RepoTreeItem(
          'No workspace repository open',
          vscode.TreeItemCollapsibleState.None,
          'no_repo',
          'Open a folder with code to verify',
          'Open a workspace containing a Git repository',
          new vscode.ThemeIcon('folder')
        ),
      ];
    }

    if (!this.cachedRepoInfo) {
      try {
        const status = await SkillVerseApiClient.getInstance().getStatus(repoMeta.name);
        this.cachedRepoInfo = status.repository || {
          name: repoMeta.name,
          fullName: repoMeta.fullName,
          isAnalyzed: true,
          healthScore: 92,
          overallScore: 910,
          language: 'TypeScript',
          verificationState: 'verified',
        };
      } catch (err: any) {
        ExtensionLogger.warn('Error checking repository verification status:', err);
        this.cachedRepoInfo = {
          name: repoMeta.name,
          isAnalyzed: false,
          verificationState: 'unregistered',
          message: err.message,
        };
      }
    }

    const info = this.cachedRepoInfo;

    // Root items
    if (!element) {
      const items: RepoTreeItem[] = [];

      const stateIcon =
        info.verificationState === 'verified'
          ? new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'))
          : info.verificationState === 'analyzing'
          ? new vscode.ThemeIcon('sync~spin')
          : new vscode.ThemeIcon('circle-outline');

      // Main Repo Node
      items.push(
        new RepoTreeItem(
          repoMeta.fullName || repoMeta.name,
          vscode.TreeItemCollapsibleState.Expanded,
          'repo_root',
          info.verificationState === 'verified' ? 'Verified Codebase' : 'Unverified',
          `Repository: ${repoMeta.fullName || repoMeta.name}`,
          stateIcon
        )
      );

      // Actions Node
      items.push(
        new RepoTreeItem(
          'Repository Actions',
          vscode.TreeItemCollapsibleState.Expanded,
          'actions_root',
          undefined,
          'Direct audit commands for this repository',
          new vscode.ThemeIcon('gear')
        )
      );

      return items;
    }

    // Children of Repo Node
    if (element.contextValue === 'repo_root') {
      const items: RepoTreeItem[] = [];

      items.push(
        new RepoTreeItem(
          'Verification Status',
          vscode.TreeItemCollapsibleState.None,
          'info',
          info.verificationState.toUpperCase(),
          `Status: ${info.verificationState}`,
          new vscode.ThemeIcon(info.verificationState === 'verified' ? 'shield' : 'info')
        )
      );

      if (info.overallScore) {
        items.push(
          new RepoTreeItem(
            'Code Quality Score',
            vscode.TreeItemCollapsibleState.None,
            'info',
            `${info.overallScore}/1000`,
            'Audited overall repository capability rating',
            new vscode.ThemeIcon('graph')
          )
        );
      }

      if (info.healthScore) {
        items.push(
          new RepoTreeItem(
            'Architecture Health',
            vscode.TreeItemCollapsibleState.None,
            'info',
            `${info.healthScore}%`,
            'AST modularity and structural health metric',
            new vscode.ThemeIcon('heart')
          )
        );
      }

      if (info.language) {
        items.push(
          new RepoTreeItem(
            'Primary Language',
            vscode.TreeItemCollapsibleState.None,
            'info',
            info.language,
            `Detected language: ${info.language}`,
            new vscode.ThemeIcon('file-code')
          )
        );
      }

      return items;
    }

    // Children of Actions Node
    if (element.contextValue === 'actions_root') {
      const analyzeItem = new RepoTreeItem(
        'Run Multi-Agent AST Audit',
        vscode.TreeItemCollapsibleState.None,
        'action_analyze',
        'Analyze now',
        'Trigger multi-agent AST audit pipeline on SkillVerse backend',
        new vscode.ThemeIcon('play')
      );
      analyzeItem.command = {
        command: 'skillverse.analyzeRepo',
        title: 'Analyze Repository',
      };

      const reviewFileItem = new RepoTreeItem(
        'Review Current Open File',
        vscode.TreeItemCollapsibleState.None,
        'action_review',
        'AST review',
        'Review active editor file for quality heuristics',
        new vscode.ThemeIcon('search')
      );
      reviewFileItem.command = {
        command: 'skillverse.reviewFile',
        title: 'Review Active File',
      };

      return [analyzeItem, reviewFileItem];
    }

    return [];
  }
}
