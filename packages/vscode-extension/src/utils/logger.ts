import * as vscode from 'vscode';

export class ExtensionLogger {
  private static outputChannel: vscode.OutputChannel | null = null;

  public static initialize(): void {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel('SkillVerse');
    }
  }

  public static info(message: string): void {
    const time = new Date().toLocaleTimeString();
    this.outputChannel?.appendLine(`[${time}] [INFO] ${message}`);
  }

  public static warn(message: string): void {
    const time = new Date().toLocaleTimeString();
    this.outputChannel?.appendLine(`[${time}] [WARN] ${message}`);
  }

  public static error(message: string, error?: any): void {
    const time = new Date().toLocaleTimeString();
    const errText = error ? ` - ${error.message || error}` : '';
    this.outputChannel?.appendLine(`[${time}] [ERROR] ${message}${errText}`);
  }

  public static show(): void {
    this.outputChannel?.show(true);
  }
}
