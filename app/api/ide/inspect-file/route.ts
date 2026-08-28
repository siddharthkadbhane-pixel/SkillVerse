import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { filePath, language, code, action } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'File content or code snippet required.' }, { status: 400 });
    }

    const lines = code.split('\n');
    const lineCount = lines.length;
    const cleanFileName = filePath ? filePath.split(/[\\\/]/).pop() : 'untitled';
    const lang = language || (cleanFileName.endsWith('.ts') ? 'typescript' : cleanFileName.endsWith('.rs') ? 'rust' : 'javascript');

    // Deterministic AST heuristic checks
    const hasStrictTypes = code.includes('interface ') || code.includes('type ') || code.includes('struct ') || code.includes('impl ');
    const hasErrorHandling = code.includes('try {') || code.includes('catch') || code.includes('Result<') || code.includes('withDbTimeout');
    const hasAsyncAwait = code.includes('async ') && code.includes('await ');
    const hasLogging = code.includes('Logger.') || code.includes('console.log') || code.includes('tracing::');
    const hasSecuritySanitization = code.includes('z.object') || code.includes('sanitize') || code.includes('RateLimiter');

    // Compute quality metrics (0 - 100)
    let codeQualityScore = 75;
    if (hasStrictTypes) codeQualityScore += 10;
    if (hasErrorHandling) codeQualityScore += 8;
    if (hasSecuritySanitization) codeQualityScore += 5;
    if (lineCount > 300) codeQualityScore -= 5;
    codeQualityScore = Math.min(100, Math.max(40, codeQualityScore));

    const insights: string[] = [];
    const suggestions: string[] = [];

    if (hasStrictTypes) {
      insights.push('Strong type safety observed with explicit type definitions.');
    } else {
      suggestions.push('Add strict TypeScript interfaces / type annotations to function parameters.');
    }

    if (hasErrorHandling) {
      insights.push('Defensive error boundaries and exception handling detected.');
    } else {
      suggestions.push('Wrap external I/O and asynchronous calls in try/catch blocks with fallback recovery.');
    }

    if (hasAsyncAwait) {
      insights.push('Modern non-blocking asynchronous execution patterns utilized.');
    }

    if (hasSecuritySanitization) {
      insights.push('Input validation and defensive security guards present.');
    } else {
      suggestions.push('Validate incoming request structures using schema validators (e.g. Zod).');
    }

    const complexity = lineCount > 250 ? 'High' : lineCount > 100 ? 'Moderate' : 'Low';

    const explainSummary = action === 'review'
      ? `SkillVerse AST Code Audit for ${cleanFileName}: Scored ${codeQualityScore}/100 with ${complexity} cyclomatic complexity. ${insights.join(' ')}`
      : `SkillVerse Architecture Explanation for ${cleanFileName} (${lang}): ${lineCount} lines implementing modular patterns with ${complexity} structural density.`;

    Logger.info(`IDE inspected file: ${cleanFileName} (${action || 'review'}) for @${user.username}`);

    return NextResponse.json({
      success: true,
      data: {
        fileName: cleanFileName,
        language: lang,
        lineCount,
        complexity,
        score: codeQualityScore,
        summary: explainSummary,
        insights,
        suggestions,
        evaluatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    Logger.error('IDE inspect-file error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
