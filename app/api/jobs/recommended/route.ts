import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { jobs, trustScores, skillDna } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock recommended jobs list if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'job_001',
            title: 'Senior TypeScript Architect',
            companyName: 'Stripe',
            salary: '$120,000 - $160,000',
            locationType: 'remote',
            minTrustScore: 750,
            matchPercentage: 88,
          },
          {
            id: 'job_003',
            title: 'Junior Front-End Developer',
            companyName: 'Linear Inc',
            salary: '£45,000 - £60,000',
            locationType: 'full_time',
            minTrustScore: 500,
            matchPercentage: 92,
          }
        ]
      });
    }

    try {
      const trust = await db.query.trustScores.findFirst({
        where: eq(trustScores.userId, user.id),
      });

      const dna = await db.query.skillDna.findFirst({
        where: eq(skillDna.userId, user.id),
      });

      const allJobs = await db.query.jobs.findMany();
      const userTrust = trust?.overallScore || 150;
      
      const skillsList = dna ? (dna.dnaStructure as any).skills.map((s: any) => s.name.toLowerCase()) : [];

      const recommended = allJobs.map((job: any) => {
        const required = (job.requiredSkills as string[]) || [];
        
        let matchCount = 0;
        required.forEach(skill => {
          if (skillsList.includes(skill.toLowerCase())) {
            matchCount++;
          }
        });

        const skillRatio = required.length > 0 ? matchCount / required.length : 0.5;
        const trustRatio = Math.min(1.0, userTrust / (job.minTrustScore || 500));
        
        const matchPercentage = Math.round((skillRatio * 70) + (trustRatio * 30));

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          salary: job.salaryRange || '$160,000 - $200,000',
          locationType: job.location || 'Remote',
          minTrustScore: job.minTrustScore,
          matchPercentage,
        };
      }).sort((a, b) => b.matchPercentage - a.matchPercentage);

      return NextResponse.json({
        success: true,
        data: recommended,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'job_001',
            title: 'Senior TypeScript Architect',
            companyName: 'Stripe',
            salary: '$120,000 - $160,000',
            locationType: 'remote',
            minTrustScore: 750,
            matchPercentage: 88,
          }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
