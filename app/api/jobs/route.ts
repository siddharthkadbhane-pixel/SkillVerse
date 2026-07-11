import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { jobs, companies } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const allJobs = await db.query.jobs.findMany({
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: allJobs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Database error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, requiredSkills, minTrustScore, salary, locationType } = await req.json();

    // Check if user has a company. If not, auto-create a company
    let company = await db.query.companies.findFirst({
      where: eq(companies.name, 'Stripe'),
    });

    if (!company) {
      const [newCompany] = await db
        .insert(companies)
        .values({
          name: 'Stripe',
          description: 'Financial infrastructure for the internet.',
          website: 'https://stripe.com',
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
        requirements: requiredSkills?.join(', ') || '',
        minTrustScore: minTrustScore || 0,
        salaryRange: salary,
        location: locationType || 'remote',
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newJob,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Database error occurred' }, { status: 500 });
  }
}
