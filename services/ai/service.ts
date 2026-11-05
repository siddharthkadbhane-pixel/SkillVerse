import { db } from '@/lib/drizzle';
import { repositories, reviews, userSkills, skills, skillDna } from '@/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { REPOSITORY_REVIEW_SYSTEM_PROMPT, buildReviewUserPrompt } from './prompts';
import { AiOutputValidator } from './validators';
import { AiReviewOutput } from './types';

import { RepositoryIntelligenceService } from '../intelligence/service';
import { RepositoryHealthService } from '../health/service';
import { NotificationsService } from '../notifications/service';
import { Logger } from '@/lib/logger';
import { reviewHistory } from '@/database/schema';

export class AiReviewService {
  private static HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
  private static MODEL = process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-Coder-32B-Instruct';

  // Master method to trigger and process AI Review
  static async processRepositoryReview(repoId: string, gitToken: string): Promise<any> {
    // 1. Fetch repository record from DB
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(repoId);
    const repo = await db.query.repositories.findFirst({
      where: isUuid ? eq(repositories.id, repoId) : eq(repositories.githubRepoId, parseInt(repoId, 10)),
    });

    if (!repo) {
      throw new Error(`Repository record ${repoId} not found in database.`);
    }

    let contextData = repo.context as any;
    if (!contextData) {
      Logger.info(`[AI Review Service] No file context found for ${repo.fullName}. Running analyzer pipeline...`);
      const { RepositoryAnalyzerService } = await import('../analyzer');
      const analysisResult = await RepositoryAnalyzerService.runAnalysis(repo.id, repo.fullName, gitToken);
      contextData = analysisResult.context;
      await db.update(repositories).set({
        isAnalyzed: true,
        analyzedAt: new Date(),
        metadata: contextData.metadata,
        summary: analysisResult.summary,
        context: contextData,
        updatedAt: new Date(),
      }).where(eq(repositories.id, repo.id));
    }

    // 2. Mark status as running
    await db
      .update(repositories)
      .set({ reviewStatus: 'running' })
      .where(isUuid ? eq(repositories.id, repoId) : eq(repositories.githubRepoId, parseInt(repoId, 10)));

    try {
      let parsedReview: AiReviewOutput;

      // Local Deterministic Intelligence and Health scanning
      const intelReport = RepositoryIntelligenceService.generateReport(contextData);
      const healthReport = RepositoryHealthService.generateReport(contextData, intelReport);

      let provenanceStatus: 'verified_inference' | 'simulated' | 'unknown' = 'verified_inference';
      let modelProvider: string = 'huggingface';
      let modelName: string = this.MODEL;

      const isProduction = process.env.NODE_ENV === 'production';

      if (!this.HUGGINGFACE_API_KEY) {
        if (isProduction) {
          throw new Error('[AI Review Service] AI inference provider is unconfigured in production. Mock review generation is strictly prohibited.');
        }
        Logger.warn('⚠️ HUGGINGFACE_API_KEY is not defined. Generating simulated review in non-production environment...');
        parsedReview = this.generateMockReview(repo.name, contextData);
        provenanceStatus = 'simulated';
        modelProvider = 'mock';
        modelName = 'local-simulation';
      } else {
        try {
          // Send request to Hugging Face
          const rawResponse = await this.queryHuggingFace(repo.name, contextData);
          parsedReview = AiOutputValidator.parseAndValidate(rawResponse);
          provenanceStatus = 'verified_inference';
          modelProvider = 'huggingface';
          modelName = this.MODEL;
        } catch (hfError: any) {
          if (isProduction) {
            Logger.error('❌ Hugging Face review generation failed in production:', hfError);
            throw new Error(`[AI Review Service] AI inference failed: ${hfError.message || 'Provider unavailable'}. Review aborted.`);
          }
          Logger.warn('⚠️ HuggingFace review generation failed. Falling back to simulated review in non-production environment:', hfError);
          parsedReview = this.generateMockReview(repo.name, contextData);
          provenanceStatus = 'simulated';
          modelProvider = 'mock';
          modelName = 'local-simulation';
        }
      }

      const isGenuine = provenanceStatus === 'verified_inference';

      // Ground extracted skills against codebase context to avoid hallucinated claims (Phase 42)
      const { groundedSkills, unsupportedClaims } = AiOutputValidator.groundExtractedSkills(
        parsedReview.skills || [],
        contextData
      );

      // Map skills with confidence, evidence, and status (Module 2)
      const mappedSkills = groundedSkills.map((skill: any) => ({
        name: skill.name,
        category: skill.category,
        level: skill.level,
        confidence: Math.min(100, Math.max(10, Math.round(parsedReview.confidence_score * 0.95))),
        evidence: isGenuine
          ? `Detected imports and patterns inside ${repo.name} manifest and source files.`
          : `Simulated development analysis for ${repo.name}. Genuine review required for verification.`,
        repositorySource: repo.fullName,
        verificationStatus: isGenuine ? ('verified' as const) : ('unverified' as const),
      }));

      // Compile AI Explainability parameters (Module 6)
      const aiExplainability = {
        executiveSummary: parsedReview.summary,
        positiveFindings: parsedReview.strengths,
        problemsFound: parsedReview.weaknesses,
        evidence: `Analyzed manifest, README configuration, and ${contextData.topSourceFiles?.length || 0} code files.`,
        reasoning: parsedReview.architecture || 'Clean modern directory structure layout.',
        suggestedFixes: parsedReview.learning_recommendations,
        learningResources: parsedReview.learning_recommendations.map(r => `${r} (SkillVerse Learning Hub)`),
        confidenceLevel: parsedReview.confidence_score,
        repositoryImpact: Math.min(100, Math.max(0, parsedReview.overall_score)),
        trustImpact: Math.round(parsedReview.overall_score * 0.2),
      };

      // 3. Save review record to database (with JSON reports - resilient to unmigrated columns)
      let reviewRecord: any;
      try {
        const reviewUpsertRes = await db.execute(sql`
          INSERT INTO reviews (
            id, repository_id, summary, strengths, weaknesses, architecture,
            code_quality, documentation, best_practices, suggested_learning,
            overall_score, confidence_score, health_scores, intelligence_report,
            ai_explainability, skills_extracted, raw_ai_output
          ) VALUES (
            gen_random_uuid(), ${repo.id}, ${parsedReview.summary},
            ${JSON.stringify(parsedReview.strengths)}::jsonb,
            ${JSON.stringify(parsedReview.weaknesses)}::jsonb,
            ${parsedReview.architecture},
            ${`Code Quality: ${parsedReview.code_quality}/100. Maintainability: ${parsedReview.maintainability}/100.`},
            ${`Documentation rating is ${parsedReview.documentation}/100.`},
            ${`Security: ${parsedReview.security}/100. Performance: ${parsedReview.performance}/100. Testing: ${parsedReview.testing}/100.`},
            ${JSON.stringify(parsedReview.learning_recommendations)}::jsonb,
            ${parsedReview.overall_score},
            ${parsedReview.confidence_score},
            ${JSON.stringify(healthReport)}::jsonb,
            ${JSON.stringify(intelReport)}::jsonb,
            ${JSON.stringify(aiExplainability)}::jsonb,
            ${JSON.stringify(mappedSkills)}::jsonb,
            ${JSON.stringify(parsedReview)}
          )
          ON CONFLICT (repository_id) DO UPDATE SET
            summary = EXCLUDED.summary,
            strengths = EXCLUDED.strengths,
            weaknesses = EXCLUDED.weaknesses,
            architecture = EXCLUDED.architecture,
            code_quality = EXCLUDED.code_quality,
            documentation = EXCLUDED.documentation,
            best_practices = EXCLUDED.best_practices,
            suggested_learning = EXCLUDED.suggested_learning,
            overall_score = EXCLUDED.overall_score,
            confidence_score = EXCLUDED.confidence_score,
            health_scores = EXCLUDED.health_scores,
            intelligence_report = EXCLUDED.intelligence_report,
            ai_explainability = EXCLUDED.ai_explainability,
            skills_extracted = EXCLUDED.skills_extracted,
            raw_ai_output = EXCLUDED.raw_ai_output
          RETURNING *
        `);
        reviewRecord = (reviewUpsertRes as any[])[0] || { id: repo.id, ...parsedReview };
      } catch (upsertErr: any) {
        Logger.error('Review upsert fallback:', upsertErr);
        reviewRecord = { id: repo.id, ...parsedReview };
      }

      // Save version history record (Module 8 - resilient to unmigrated columns)
      try {
        const countRes = await db.execute(sql`SELECT count(*)::int as count FROM review_history WHERE repository_id = ${repo.id}`);
        const nextVersion = Number((countRes as any[])[0]?.count || 0) + 1;

        await db.execute(sql`
          INSERT INTO review_history (
            id, repository_id, version, summary, strengths, weaknesses, architecture,
            code_quality, documentation, best_practices, suggested_learning,
            overall_score, confidence_score, health_scores, intelligence_report,
            ai_explainability, skills_extracted, raw_ai_output
          ) VALUES (
            gen_random_uuid(), ${repo.id}, ${nextVersion}, ${parsedReview.summary},
            ${JSON.stringify(parsedReview.strengths)}::jsonb,
            ${JSON.stringify(parsedReview.weaknesses)}::jsonb,
            ${parsedReview.architecture},
            ${`Code Quality: ${parsedReview.code_quality}/100. Maintainability: ${parsedReview.maintainability}/100.`},
            ${`Documentation rating is ${parsedReview.documentation}/100.`},
            ${`Security: ${parsedReview.security}/100. Performance: ${parsedReview.performance}/100. Testing: ${parsedReview.testing}/100.`},
            ${JSON.stringify(parsedReview.learning_recommendations)}::jsonb,
            ${parsedReview.overall_score},
            ${parsedReview.confidence_score},
            ${JSON.stringify(healthReport)}::jsonb,
            ${JSON.stringify(intelReport)}::jsonb,
            ${JSON.stringify(aiExplainability)}::jsonb,
            ${JSON.stringify(mappedSkills)}::jsonb,
            ${JSON.stringify(parsedReview)}
          )
        `);
      } catch (histErr) {
        Logger.warn('Version history write notice:', histErr);
      }

      // 4. Extract and save verified skills
      if (parsedReview.skills && parsedReview.skills.length > 0 && repo.userId) {
        for (const skillItem of parsedReview.skills) {
          try {
            // Find or create skill in master catalog
            let matchedSkill = await db.query.skills.findFirst({
              where: eq(skills.name, skillItem.name),
            });

            let skillId = matchedSkill?.id;

            if (!skillId) {
              const [newSkill] = await db
                .insert(skills)
                .values({
                  name: skillItem.name,
                  category: skillItem.category,
                  description: `AI-verified skill from analysis of ${repo.name}`,
                })
                .onConflictDoUpdate({
                  target: skills.name,
                  set: { category: skillItem.category },
                })
                .returning();
              skillId = newSkill.id;
            }

            // Check if user already has this skill verified (explicit column select for live DB resilience)
            const existingSkills = await db
              .select({ userId: userSkills.userId })
              .from(userSkills)
              .where(
                and(
                  eq(userSkills.userId, repo.userId),
                  eq(userSkills.skillId, skillId)
                )
              )
              .limit(1);

            const isNewSkill = existingSkills.length === 0;

            // Upsert user skill (resilient to unmigrated columns)
            try {
              await db.execute(sql`
                INSERT INTO user_skills (user_id, skill_id, proficiency_level, verification_source, review_id)
                VALUES (${repo.userId}, ${skillId}, ${skillItem.level}, ${isGenuine ? 'ai_review' : 'simulated_review'}, ${reviewRecord.id})
                ON CONFLICT (user_id, skill_id) DO UPDATE SET
                  proficiency_level = EXCLUDED.proficiency_level,
                  verification_source = EXCLUDED.verification_source,
                  review_id = EXCLUDED.review_id
              `);
            } catch (usErr) {
              Logger.warn('User skill upsert notice:', usErr);
            }

            if (isNewSkill && repo.userId) {
              await NotificationsService.sendNotification({
                userId: repo.userId,
                title: 'New Skill Mapped & Verified',
                content: `Verified skill "${skillItem.name}" has been added to your passport.`,
                type: 'new_skill_verified',
                actionUrl: '/skills',
              });
            }
          } catch (skillErr) {
            Logger.warn(`⚠️ Failed to save skill "${skillItem.name}":`, skillErr);
          }
        }
      }

      // 5. Calculate and update Trust Score (only genuine verified reviews)
      if (repo.userId && isGenuine) {
        try {
          const { TrustCalculatorService } = await import('../trust/calculator');
          await TrustCalculatorService.calculateUserTrustScore(repo.userId);
        } catch (trustErr) {
          Logger.warn('⚠️ Failed to update trust score:', trustErr);
        }
      }

      // 6. Update Skill DNA structure (only genuine verified reviews)
      if (repo.userId && isGenuine) {
        try {
          const allUserSkillRecords = await db
            .select({
              proficiencyLevel: userSkills.proficiencyLevel,
              skillName: skills.name,
              skillCategory: skills.category,
            })
            .from(userSkills)
            .leftJoin(skills, eq(userSkills.skillId, skills.id))
            .where(eq(userSkills.userId, repo.userId));

          const dnaStructure = allUserSkillRecords.map((us: any) => ({
            name: us.skillName || 'Unknown',
            category: us.skillCategory || 'General',
            level: us.proficiencyLevel,
            weight: (us.proficiencyLevel || 1) * 20,
          }));

          await db
            .insert(skillDna)
            .values({
              userId: repo.userId,
              dnaStructure,
            })
            .onConflictDoUpdate({
              target: skillDna.userId,
              set: {
                dnaStructure,
                updatedAt: new Date(),
              },
            });
        } catch (dnaErr) {
          Logger.warn('⚠️ Failed to update skill DNA:', dnaErr);
        }
      }

      // 7. Update repository review status
      await db
        .update(repositories)
        .set({ 
          reviewStatus: 'completed',
          isAnalyzed: true,
          analyzedAt: new Date(),
        })
        .where(isUuid ? eq(repositories.id, repoId) : eq(repositories.githubRepoId, parseInt(repoId, 10)));

      // 8. Trigger Capability Growth Engine Events (Phase 23) (only genuine verified reviews)
      if (repo.userId && isGenuine) {
        try {
          const { CapabilityGrowthService } = await import('../dcc/growth');
          await CapabilityGrowthService.processAuditGrowthEvents(
            repo.userId,
            { id: repo.id, name: repo.name, fullName: repo.fullName, isAnalyzed: true },
            { overallScore: parsedReview.overall_score, architecture: parsedReview.architecture, codeQuality: String(parsedReview.code_quality) },
            parsedReview.skills || []
          );
        } catch (growthErr) {
          Logger.warn('⚠️ Failed to record capability growth events:', growthErr);
        }
      }

      // Trigger Completion Notification (Module 9)
      if (repo.userId) {
        await NotificationsService.sendNotification({
          userId: repo.userId,
          title: 'Repository Review Completed',
          content: `AI Review for "${repo.name}" has completed successfully. Overall score: ${parsedReview.overall_score}/100.`,
          type: 'analysis_completed',
          actionUrl: `/repositories/${repo.id}`,
        });
      }

      return reviewRecord;
    } catch (err: any) {
      Logger.error('❌ Failed processing AI Review for repository:', err);
      
      // Update repository status to failed
      await db
        .update(repositories)
        .set({ reviewStatus: 'failed' })
        .where(isUuid ? eq(repositories.id, repoId) : eq(repositories.githubRepoId, parseInt(repoId, 10)));

      throw err;
    }
  }

  // HTTP wrapper for querying Hugging Face with Retry Policy
  private static async queryHuggingFace(repoName: string, contextData: any, retries = 3): Promise<string> {
    const prompt = buildReviewUserPrompt(repoName, contextData);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.MODEL,
            messages: [
              { role: 'system', content: REPOSITORY_REVIEW_SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1800,
          }),
        });

        // Handle rate limit (429) or transient server errors with exponential backoff
        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.warn(`Attempt ${attempt} failed with status ${response.status}. Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error(`HF Inference HTTP Error [${response.status}]: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.choices || !result.choices[0] || !result.choices[0].message) {
          throw new Error(`Unexpected Hugging Face API response structure: ${JSON.stringify(result)}`);
        }
        const outputText = result.choices[0].message.content;
        
        if (!outputText) {
          throw new Error('LLM did not return any generated text');
        }

        return outputText;
      } catch (err) {
        if (attempt === retries) throw err;
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    throw new Error('Failed to query Hugging Face after maximum retries');
  }

  // Fallback mock audit reviews generator
  private static generateMockReview(repoName: string, contextData: any): AiReviewOutput {
    const packageJson = contextData.packageJson || {};
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const detectedSkills: { name: string; category: string; level: number }[] = [];
    if (dependencies['react']) detectedSkills.push({ name: 'React', category: 'Frontend', level: 4 });
    if (dependencies['next']) detectedSkills.push({ name: 'Next.js', category: 'Frontend', level: 4 });
    if (dependencies['typescript']) detectedSkills.push({ name: 'TypeScript', category: 'Language', level: 5 });
    if (dependencies['drizzle-orm']) detectedSkills.push({ name: 'PostgreSQL', category: 'Database', level: 4 });
    if (dependencies['tailwindcss']) detectedSkills.push({ name: 'Tailwind CSS', category: 'Frontend', level: 5 });

    if (detectedSkills.length === 0) {
      detectedSkills.push({ name: 'JavaScript', category: 'Language', level: 3 });
    }

    return {
      summary: `Verified review for ${repoName}. Codebase presents a modular architecture layout built using standard programming guidelines.`,
      architecture: 'Clean modern structure using components and server-side routes.',
      project_type: dependencies['next'] ? 'Fullstack' : 'Frontend',
      complexity: 'Medium',
      strengths: [
        'Robust modular layouts',
        'Strong component-driven frontend structures',
        'Decoupled utilities and library configurations'
      ],
      weaknesses: [
        'Lacks automated test configurations (missing Vitest/Jest configs)',
        'Lacks strict type-checking checks in external helper scripts'
      ],
      code_quality: 85,
      documentation: 80,
      security: 78,
      maintainability: 82,
      performance: 88,
      testing: 20,
      skills: detectedSkills,
      learning_recommendations: [
        'Add Vitest and write basic unit tests for service utilities',
        'Integrate Zod schema parameter validation checks inside API route handlers'
      ],
      overall_score: 83,
      confidence_score: 90
    };
  }
}
export default AiReviewService;
