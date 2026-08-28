import * as vscode from 'vscode';
import { AuthManager } from '../auth/manager';
import {
  SkillVerseStatusData,
  SkillVerseFileInspectionResult,
  SkillVerseUser,
  SkillVerseDCCSummary,
} from '../types';
import { ExtensionLogger } from '../utils/logger';

export class SkillVerseApiClient {
  private static instance: SkillVerseApiClient;

  public static getInstance(): SkillVerseApiClient {
    if (!this.instance) {
      this.instance = new SkillVerseApiClient();
    }
    return this.instance;
  }

  private getBaseUrl(): string {
    const config = vscode.workspace.getConfiguration('skillverse');
    return config.get<string>('apiUrl', 'http://localhost:3000').replace(/\/$/, '');
  }

  /**
   * Helper for executing authenticated fetch requests with timeout & error normalization
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      body?: any;
      timeoutMs?: number;
    } = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const timeoutMs = options.timeoutMs || 5000;

    const auth = await AuthManager.getInstance().getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMessage = errData.error;
          }
        } catch {}
        throw new Error(errMessage);
      }

      const json = await response.json();
      return (json.data ?? json) as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`SkillVerse API request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  /**
   * Authenticates with SkillVerse via Personal Access Token, API Key, or Demo key
   */
  public async authenticate(tokenOrKey: string): Promise<{ token: string; user: SkillVerseUser; dcc: SkillVerseDCCSummary }> {
    return this.request<{ token: string; user: SkillVerseUser; dcc: SkillVerseDCCSummary }>('/api/ide/auth', {
      method: 'POST',
      body: { apiKey: tokenOrKey },
      timeoutMs: 4000,
    });
  }

  /**
   * Fetches live developer status, DCC summary, career direction, and active repo verification state
   */
  public async getStatus(repoName?: string): Promise<SkillVerseStatusData> {
    const query = repoName ? `?repo=${encodeURIComponent(repoName)}` : '';
    return this.request<SkillVerseStatusData>(`/api/ide/status${query}`, {
      method: 'GET',
      timeoutMs: 4000,
    });
  }

  /**
   * Triggers background AST repository audit on SkillVerse backend
   */
  public async analyzeRepository(repoName: string, fullName?: string): Promise<any> {
    return this.request('/api/analyze', {
      method: 'POST',
      body: {
        name: repoName,
        fullName: fullName || repoName,
        githubRepoId: Math.floor(Math.random() * 1000000) + 10000,
        language: 'TypeScript',
      },
      timeoutMs: 8000,
    });
  }

  /**
   * Contextual AST File Review / Explanation
   */
  public async inspectFile(payload: {
    filePath: string;
    language: string;
    code: string;
    action: 'explain' | 'review';
  }): Promise<SkillVerseFileInspectionResult> {
    return this.request<SkillVerseFileInspectionResult>('/api/ide/inspect-file', {
      method: 'POST',
      body: payload,
      timeoutMs: 6000,
    });
  }
}
