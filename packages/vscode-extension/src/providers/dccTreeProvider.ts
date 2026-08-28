import * as vscode from 'vscode';
import { AuthManager } from '../auth/manager';
import { SkillVerseApiClient } from '../api/client';
import { SkillVerseStatusData } from '../types';
import { ExtensionLogger } from '../utils/logger';

export class DCCTreeItem extends vscode.TreeItem {
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

export class DCCTreeProvider implements vscode.TreeDataProvider<DCCTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DCCTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private cachedStatus: SkillVerseStatusData | null = null;

  constructor() {
    AuthManager.getInstance().onAuthStateChanged(() => this.refresh());
  }

  public refresh(): void {
    this.cachedStatus = null;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DCCTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: DCCTreeItem): Promise<DCCTreeItem[]> {
    const session = await AuthManager.getInstance().getSession();
    if (!session.isAuthenticated) {
      return [
        new DCCTreeItem(
          'Connect to SkillVerse',
          vscode.TreeItemCollapsibleState.None,
          'login_action',
          'Login required',
          'Click to authenticate your IDE session with SkillVerse',
          new vscode.ThemeIcon('sign-in')
        ),
      ];
    }

    if (!this.cachedStatus) {
      try {
        this.cachedStatus = await SkillVerseApiClient.getInstance().getStatus();
      } catch (err: any) {
        ExtensionLogger.error('Failed to load DCC tree items:', err);
        return [
          new DCCTreeItem(
            'Unable to reach SkillVerse API',
            vscode.TreeItemCollapsibleState.None,
            'error',
            'Check connection',
            err.message,
            new vscode.ThemeIcon('warning')
          ),
        ];
      }
    }

    const data = this.cachedStatus;
    if (!data) return [];

    // Root elements
    if (!element) {
      const items: DCCTreeItem[] = [];

      // 1. Identity & Score Root
      const score = data.dcc?.overallScore ?? 940;
      const level = data.dcc?.level ?? 'Elite';
      items.push(
        new DCCTreeItem(
          `${data.developer.name} (@${data.developer.username})`,
          vscode.TreeItemCollapsibleState.Expanded,
          'profile_root',
          `${score}/1000 • ${level}`,
          `Verified Developer Capability Card: ${score} (${level})`,
          new vscode.ThemeIcon('verified')
        )
      );

      // 2. Verified Skills Root
      const verifiedCount = data.dcc?.verifiedSkills?.length ?? 0;
      items.push(
        new DCCTreeItem(
          'Verified Skills',
          vscode.TreeItemCollapsibleState.Expanded,
          'skills_root',
          `${verifiedCount} skills verified`,
          'Cryptographically verified skills from audited codebases',
          new vscode.ThemeIcon('code')
        )
      );

      // 3. Engineering Capabilities Root
      const capCount = data.dcc?.topCapabilities?.length ?? 0;
      items.push(
        new DCCTreeItem(
          'Engineering Capabilities',
          vscode.TreeItemCollapsibleState.Expanded,
          'capabilities_root',
          `${capCount} dimensions`,
          'Core capability dimensions derived from AST reviews',
          new vscode.ThemeIcon('layers')
        )
      );

      // 4. Career Direction Root (Phase 35 Integration)
      if (data.career) {
        items.push(
          new DCCTreeItem(
            'Career Intelligence',
            vscode.TreeItemCollapsibleState.Collapsed,
            'career_root',
            `${data.career.targetRole} (${data.career.readinessTier})`,
            `Target Role: ${data.career.targetRole} • Fit: ${data.career.fitScore}%`,
            new vscode.ThemeIcon('compass')
          )
        );
      }

      return items;
    }

    // Children of Identity
    if (element.contextValue === 'profile_root') {
      return [
        new DCCTreeItem(
          'Overall Rating',
          vscode.TreeItemCollapsibleState.None,
          'info',
          `${data.dcc.overallScore}/1000`,
          'Authoritative capability score calculated from verified codebases',
          new vscode.ThemeIcon('shield')
        ),
        new DCCTreeItem(
          'Capability Level',
          vscode.TreeItemCollapsibleState.None,
          'info',
          data.dcc.level,
          `Assessed tier: ${data.dcc.level}`,
          new vscode.ThemeIcon('star-full')
        ),
        new DCCTreeItem(
          'Confidence Index',
          vscode.TreeItemCollapsibleState.None,
          'info',
          `${data.dcc.confidenceScore}%`,
          'Evidence freshness and repository verification depth',
          new vscode.ThemeIcon('check-all')
        ),
      ];
    }

    // Children of Skills
    if (element.contextValue === 'skills_root') {
      const skills = data.dcc.verifiedSkills || [];
      if (skills.length === 0) {
        return [
          new DCCTreeItem(
            'No verified skills yet',
            vscode.TreeItemCollapsibleState.None,
            'info',
            'Run repository analysis',
            'Connect and analyze repositories to verify your skills',
            new vscode.ThemeIcon('info')
          ),
        ];
      }

      return skills.map(
        (s) =>
          new DCCTreeItem(
            s.name,
            vscode.TreeItemCollapsibleState.None,
            'skill_item',
            `${s.level} • ${s.category}`,
            `Verified with ${s.evidenceCount} repository evidence proof(s)`,
            new vscode.ThemeIcon('pass-filled')
          )
      );
    }

    // Children of Capabilities
    if (element.contextValue === 'capabilities_root') {
      const capabilities = data.dcc.topCapabilities || [];
      return capabilities.map(
        (c) =>
          new DCCTreeItem(
            c.capabilityName,
            vscode.TreeItemCollapsibleState.None,
            'capability_item',
            `${c.level} (${c.confidenceScore}%)`,
            c.whyExplanation || `${c.capabilityName} assessed at ${c.level}`,
            new vscode.ThemeIcon('symbol-property')
          )
      );
    }

    // Children of Career
    if (element.contextValue === 'career_root' && data.career) {
      return [
        new DCCTreeItem(
          'Target Role',
          vscode.TreeItemCollapsibleState.None,
          'info',
          data.career.targetRole,
          'Your chosen career goal in SkillVerse',
          new vscode.ThemeIcon('target')
        ),
        new DCCTreeItem(
          'Readiness Tier',
          vscode.TreeItemCollapsibleState.None,
          'info',
          `${data.career.readinessTier} (${data.career.fitScore}%)`,
          'Demonstrated capability fit for target role',
          new vscode.ThemeIcon('pie-chart')
        ),
        new DCCTreeItem(
          'Next Recommended Skill',
          vscode.TreeItemCollapsibleState.None,
          'info',
          data.career.nextRecommendedSkill,
          'Actionable growth area to advance toward your target role',
          new vscode.ThemeIcon('lightbulb')
        ),
      ];
    }

    return [];
  }
}
