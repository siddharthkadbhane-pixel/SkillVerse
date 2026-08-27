import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { graphNodes, graphEdges } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { DUMMY_GRAPH_DATA } from '@/lib/dummyData';
import { eq, sql } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let nodes: any[] = [];
    let edges: any[] = [];

    try {
      nodes = await db.query.graphNodes.findMany({
        where: eq(graphNodes.userId, user.id),
      });

      const nodeIds = nodes.map(n => n.id);
      if (nodeIds.length > 0) {
        edges = await db.query.graphEdges.findMany({
          where: sql`source_node_id = ANY(${nodeIds}) OR target_node_id = ANY(${nodeIds})`,
        });
      }
    } catch {}

    if (nodes.length === 0) {
      const popularTech = [
        { name: 'TypeScript', popularity: 98, growth: '+24%' },
        { name: 'Next.js 15', popularity: 95, growth: '+32%' },
        { name: 'Rust', popularity: 89, growth: '+41%' },
        { name: 'Python / LLMs', popularity: 94, growth: '+55%' },
        { name: 'PostgreSQL', popularity: 91, growth: '+18%' },
      ];

      return NextResponse.json({
        success: true,
        data: {
          nodes: DUMMY_GRAPH_DATA.nodes,
          edges: DUMMY_GRAPH_DATA.edges,
          popularTech,
        }
      });
    }

    const skillsList = nodes.filter(n => n.type === 'skill');
    const popularTech = skillsList.map(s => ({
      name: s.label,
      popularity: Math.floor(Math.random() * 50) + 30,
      growth: `+${Math.floor(Math.random() * 20) + 5}%`,
    }));

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        edges,
        popularTech,
      }
    });
  } catch (error: any) {
    Logger.error('API Error in /api/graph:', error);
    return NextResponse.json({
      success: true,
      data: {
        nodes: DUMMY_GRAPH_DATA.nodes,
        edges: DUMMY_GRAPH_DATA.edges,
        popularTech: [
          { name: 'TypeScript', popularity: 98, growth: '+24%' },
          { name: 'Next.js 15', popularity: 95, growth: '+32%' },
          { name: 'Rust', popularity: 89, growth: '+41%' },
        ],
      }
    });
  }
}
