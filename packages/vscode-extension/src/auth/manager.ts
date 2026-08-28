import * as vscode from 'vscode';
import { AuthSessionState, SkillVerseUser } from '../types';
import { ExtensionLogger } from '../utils/logger';

const TOKEN_SECRET_KEY = 'skillverse.session_token';
const USER_STATE_KEY = 'skillverse.cached_user';

export class AuthManager {
  private static instance: AuthManager;
  private secrets: vscode.SecretStorage;
  private globalState: vscode.Memento;
  private onAuthStateChangedEmitter = new vscode.EventEmitter<AuthSessionState>();

  public readonly onAuthStateChanged = this.onAuthStateChangedEmitter.event;

  private constructor(context: vscode.ExtensionContext) {
    this.secrets = context.secrets;
    this.globalState = context.globalState;
  }

  public static initialize(context: vscode.ExtensionContext): AuthManager {
    if (!this.instance) {
      this.instance = new AuthManager(context);
    }
    return this.instance;
  }

  public static getInstance(): AuthManager {
    return this.instance;
  }

  /**
   * Retrieves current authentication session state
   */
  public async getSession(): Promise<AuthSessionState> {
    try {
      const token = await this.secrets.get(TOKEN_SECRET_KEY);
      const user = this.globalState.get<SkillVerseUser>(USER_STATE_KEY);

      return {
        isAuthenticated: !!token,
        token: token || undefined,
        user: token ? user : undefined,
      };
    } catch (err: any) {
      ExtensionLogger.error('Failed to read session secrets:', err);
      return { isAuthenticated: false };
    }
  }

  /**
   * Securely saves authentication token into VS Code SecretStorage
   */
  public async login(token: string, user: SkillVerseUser): Promise<void> {
    try {
      await this.secrets.store(TOKEN_SECRET_KEY, token);
      await this.globalState.update(USER_STATE_KEY, user);
      
      ExtensionLogger.info(`Successfully logged in as @${user.username}`);
      this.onAuthStateChangedEmitter.fire({
        isAuthenticated: true,
        token,
        user,
      });
    } catch (err: any) {
      ExtensionLogger.error('Failed to store session secret:', err);
      throw err;
    }
  }

  /**
   * Removes stored session credentials on logout
   */
  public async logout(): Promise<void> {
    try {
      await this.secrets.delete(TOKEN_SECRET_KEY);
      await this.globalState.update(USER_STATE_KEY, undefined);

      ExtensionLogger.info('Logged out from SkillVerse');
      this.onAuthStateChangedEmitter.fire({
        isAuthenticated: false,
      });
    } catch (err: any) {
      ExtensionLogger.error('Failed to clear session secrets:', err);
    }
  }
}
