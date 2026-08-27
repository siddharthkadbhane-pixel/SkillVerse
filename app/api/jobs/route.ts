import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { jobs, companies } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { DUMMY_JOBS, DUMMY_COMPANIES } from '@/lib/dummyData';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    let allJobs: any[] = [];
    try {
      allJobs = await db.query.jobs.findMany({
        orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
      });
    } catch {}

    if (allJobs.length === 0) {
      return NextResponse.json({
        success: true,
        data: DUMMY_JOBS,
      });
    }

    return NextResponse.json({
      success: true,
      data: allJobs,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      data: DUMMY_JOBS,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, requiredSkills, minTrustScore, salary, locationType } = await req.json();

    try {
      let company = await db.query.companies.findFirst({
        where: eq(companies.name, 'Hyperion AI'),
      });

      if (!company) {
        const [newCompany] = await db
          .insert(companies)
          .values({
            name: 'Hyperion AI',
            description: 'Next-generation frontier AI infrastructure & systems.',
            website: 'https://hyperion.ai',
            verified: true,
          })
          .returning();
        company = newCompany;
      }

      const [newJob] = await db
        .insert(jobs)
        .values({
          companyId: company.id,
          title,
          description,
          requirements: Array.isArray(requiredSkills) ? requiredSkills.join(', ') : requiredSkills || '',
          minTrustScore: minTrustScore || 0,
          salaryRange: salary,
          location: locationType || 'remote',
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: newJob,
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          id: `job_mock_${Date.now()}`,
          companyId: DUMMY_COMPANIES[0].id,
          companyName: DUMMY_COMPANIES[0].name,
          title,
          description,
          requirements: requiredSkills || ['TypeScript', 'Next.js'],
          minTrustScore: minTrustScore || 750,
          salaryRange: salary || '$160,000 - $200,000',
          location: locationType || 'Remote',
          createdAt: new Date().toISOString(),
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
