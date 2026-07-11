import { db } from '@/lib/drizzle';
import { repositories, reviews, trustScores } from '@/database/schema';
import { eq, and } from 'drizzle-orm';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  evidence: string;
}

export class PassportBadgeService {
  
  // Scans database records and compiles a list of unlocked badges
  static async calculateBadgesForUser(userId: string): Promise<AchievementBadge[]> {
    const list: AchievementBadge[] = [];

    // Fetch user repos & trust scores
    const userRepos = await db.query.repositories.findMany({
      where: and(
        eq(repositories.userId, userId),
        eq(repositories.isAnalyzed, true)
      ),
    });

    const userTrust = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, userId),
    });

    const categoryScores = (userTrust?.categoryScores || {}) as any;

    // 1. First Repository Badge
    const hasRepos = userRepos.length > 0;
    list.push({
      id: 'badge_first_repo',
      title: 'First Repository Connected',
      description: 'Connected and analyzed your first repository with SkillVerse.',
      iconName: 'GitFork',
      unlocked: hasRepos,
      evidence: hasRepos 
        ? `Verified repository: "${userRepos[0].name}" connected on ${userRepos[0].createdAt.toLocaleDateString()}` 
        : 'Connect a repository to unlock.',
    });

    // 2. Documentation Expert Badge
    const isDocExpert = (categoryScores.documentation || 0) >= 80;
    list.push({
      id: 'badge_doc_expert',
      title: 'Documentation Expert',
      description: 'Verified repository documentation average score of 80/100 or higher.',
      iconName: 'BookOpen',
      unlocked: isDocExpert,
      evidence: isDocExpert
        ? `Average Documentation score verified at ${categoryScores.documentation}/100.`
        : 'Maintain high documentation scores in your codebases to unlock.',
    });

    // 3. Security Champion Badge
    const isSecurityChamp = (categoryScores.security || 0) >= 80;
    list.push({
      id: 'badge_security_champ',
      title: 'Security Champion',
      description: 'No critical vulnerabilities detected. Security category score of 80/100 or higher.',
      iconName: 'ShieldCheck',
      unlocked: isSecurityChamp,
      evidence: isSecurityChamp
        ? `Security score evaluated at ${categoryScores.security}/100.`
        : 'Implement secure dependency scopes and environment validations to unlock.',
    });

    // 4. Testing Enthusiast Badge
    const isTestingEnthusiast = (categoryScores.testing || 0) >= 50;
    list.push({
      id: 'badge_testing_enthusiast',
      title: 'Testing Enthusiast',
      description: 'Test suite integration and setup verified with code coverage score of 50/100 or higher.',
      iconName: 'Code2',
      unlocked: isTestingEnthusiast,
      evidence: isTestingEnthusiast
        ? `Testing category score calculated at ${categoryScores.testing}/100.`
        : 'Write automated unit test suites to unlock.',
    });

    // 5. Open Source Contributor Badge
    const hasStars = userRepos.some(r => r.stars > 5);
    list.push({
      id: 'badge_os_contributor',
      title: 'Open Source Contributor',
      description: 'Imported a public repository with stars from the community.',
      iconName: 'Star',
      unlocked: hasStars,
      evidence: hasStars
        ? `Verified star ratings on repository: "${userRepos.find(r => r.stars > 5)?.name}".`
        : 'Import a repository containing stars to unlock.',
    });

    // 6. Full Stack Developer Badge
    const hasFrontend = userRepos.some(r => r.language?.toLowerCase() === 'typescript' || r.language?.toLowerCase() === 'javascript');
    const hasBackend = (categoryScores.maintainability || 0) >= 70 && (categoryScores.codeQuality || 0) >= 70;
    const isFullstack = hasFrontend && hasBackend && userRepos.length >= 2;
    
    list.push({
      id: 'badge_full_stack',
      title: 'Full Stack Developer',
      description: 'Maintained frontend layout pages and verified structured backend configurations.',
      iconName: 'Layers',
      unlocked: isFullstack,
      evidence: isFullstack
        ? `Verified frontend Stack and backend configurations across ${userRepos.length} repositories.`
        : 'Connect both frontend layouts and backend codebases to unlock.',
    });

    return list;
  }
}
export default PassportBadgeService;
