import * as vscode from 'vscode';
import { SkillVerseStatusData } from '../types';

export class DCCWebviewPanel {
  public static currentPanel: DCCWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, status: SkillVerseStatusData) {
    this.panel = panel;
    this.update(status);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public static render(status: SkillVerseStatusData, extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (DCCWebviewPanel.currentPanel) {
      DCCWebviewPanel.currentPanel.panel.reveal(column);
      DCCWebviewPanel.currentPanel.update(status);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'skillverseDCC',
      `SkillVerse DCC: ${status.developer.name}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: false,
        retainContextWhenHidden: true,
      }
    );

    DCCWebviewPanel.currentPanel = new DCCWebviewPanel(panel, status);
  }

  public update(status: SkillVerseStatusData): void {
    this.panel.webview.html = this.getHtmlForWebview(status);
  }

  private getHtmlForWebview(status: SkillVerseStatusData): string {
    const dcc = status.dcc;
    const dev = status.developer;
    const skills = dcc.verifiedSkills || [];
    const caps = dcc.topCapabilities || [];

    const levelBadgeColor =
      dcc.level === 'Elite' ? '#10B981' : dcc.level === 'Expert' ? '#8B5CF6' : '#38BDF8';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Capability Card (DCC 2.0)</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 24px;
      margin: 0;
      line-height: 1.5;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 12px;
      padding: 24px;
      max-width: 720px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .profile {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid ${levelBadgeColor};
    }
    .name {
      font-size: 18px;
      font-weight: bold;
      margin: 0;
    }
    .username {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .score-badge {
      text-align: right;
    }
    .score {
      font-size: 28px;
      font-weight: 900;
      color: ${levelBadgeColor};
      font-family: var(--vscode-editor-font-family);
    }
    .level {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 4px;
      background: ${levelBadgeColor}20;
      color: ${levelBadgeColor};
      display: inline-block;
      margin-top: 4px;
    }
    .section-title {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--vscode-descriptionForeground);
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    .pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 10px 14px;
    }
    .pill-title {
      font-size: 13px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .pill-subtitle {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
    .career-box {
      background: rgba(124, 58, 237, 0.08);
      border: 1px solid rgba(124, 58, 237, 0.25);
      border-radius: 8px;
      padding: 14px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="profile">
        ${dev.avatarUrl ? `<img src="${dev.avatarUrl}" class="avatar" alt="" />` : ''}
        <div>
          <div class="name">${dev.name}</div>
          <div class="username">@${dev.username} • Verified Developer</div>
        </div>
      </div>
      <div class="score-badge">
        <div class="score">${dcc.overallScore}</div>
        <div class="level">${dcc.level}</div>
      </div>
    </div>

    <div class="section-title">Verified Technical Stack (${skills.length})</div>
    <div class="grid">
      ${skills.map(s => `
        <div class="pill">
          <div class="pill-title">
            <span>${s.name}</span>
            <span style="font-size: 10px; color: ${levelBadgeColor}">✓ Verified</span>
          </div>
          <div class="pill-subtitle">${s.category} • ${s.evidenceCount} proof(s)</div>
        </div>
      `).join('')}
    </div>

    <div class="section-title">Engineering Capabilities (${caps.length})</div>
    <div class="grid">
      ${caps.map(c => `
        <div class="pill">
          <div class="pill-title">
            <span>${c.capabilityName}</span>
            <span style="font-size: 10px;">${c.confidenceScore}%</span>
          </div>
          <div class="pill-subtitle">${c.level} level</div>
        </div>
      `).join('')}
    </div>

    ${status.career ? `
      <div class="career-box">
        <div style="font-size: 12px; font-weight: bold; color: #A78BFA; text-transform: uppercase;">
          🎯 Career Direction: ${status.career.targetRole} (${status.career.readinessTier})
        </div>
        <div style="font-size: 12px; margin-top: 6px;">
          Next Skill Focus: <strong>${status.career.nextRecommendedSkill}</strong>
        </div>
      </div>
    ` : ''}
  </div>
</body>
</html>`;
  }

  public dispose(): void {
    DCCWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}
