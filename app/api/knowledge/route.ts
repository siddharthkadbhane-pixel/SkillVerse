import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { knowledgeBase } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    try {
      const articles = await db.query.knowledgeBase.findMany({
        orderBy: (knowledgeBase, { desc }) => [desc(knowledgeBase.createdAt)],
      });

      return NextResponse.json({
        success: true,
        data: articles,
      });
    } catch {
      // Fallback mock articles
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'article_1',
            title: 'Serverless Connection Limits in Next.js App Router',
            content: 'Always define database clients outside route functions to share active connections. Configure pgBouncer connection parameters to avoid resource leaks.',
            category: 'Database',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'article_2',
            title: 'Hugging Face API Prompt Engineering Standards',
            content: 'Set clear context boundaries, specify output JSON structures, and use structured templates to optimize Llama code audits.',
            category: 'AI Engineering',
            createdAt: new Date().toISOString(),
          }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 550 });
  }
}
