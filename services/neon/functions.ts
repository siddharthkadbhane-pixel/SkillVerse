import { neonConfig } from './config';

export class NeonFunctionsService {
  /**
   * Invokes the deployed Neon Hello World function
   */
  static async invokeHello(): Promise<{ ok: boolean; status: number; text: string; url: string }> {
    const url = neonConfig.functions.helloBaseUrl;
    if (!url) {
      return { ok: false, status: 0, text: '', url: 'NEON_FUNCTION_HELLO_BASE_URL not configured' };
    }

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'SkillVerse-Core/1.0' },
      });
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        text,
        url,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 500,
        text: err.message,
        url,
      };
    }
  }
}
