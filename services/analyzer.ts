import { db } from '@/lib/drizzle';
import { repositories } from '@/database/schema';
import { eq } from 'drizzle-orm';

export interface RepositoryMetadata {
  owner: string;
  defaultBranch: string;
  languagesBreakdown: Record<string, number>;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  topics: string[];
}

export interface CommitActivityInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface CommitActivityStats {
  commits: CommitActivityInfo[];
  uniqueContributors: number;
  firstCommitDate: string | null;
  latestCommitDate: string | null;
  commitFrequencyPerWeek: number;
}

export interface ArchitectureSummary {
  framework: string;
  languages: string[];
  libraries: string[];
  projectType: 'Frontend' | 'Backend' | 'Fullstack' | 'Library' | 'Mobile' | 'Unknown';
  complexity: 'Low' | 'Medium' | 'High';
  folderStructure: string[];
  developmentActivity: 'Low' | 'Medium' | 'High';
}

export interface AnalyzerContext {
  metadata: any;
  readme: string | null;
  packageJson: any | null;
  topSourceFiles: { path: string; content: string }[];
  commits: CommitActivityInfo[];
  languagesBreakdown: Record<string, number>;
}

export class RepositoryAnalyzerService {
  private static BASE_URL = 'https://api.github.com';

  private static async githubFetch(endpoint: string, token: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/vnd.github.v3+json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('User-Agent', 'SkillVerse-AI-Agent');

    const res = await fetch(`${this.BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`GitHub API Error [${res.status}]: ${res.statusText}`);
    }

    return res.json();
  }

  // Step 1: Validate Repository
  static async validateRepository(fullName: string, token: string): Promise<boolean> {
    const [owner, repo] = fullName.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository name format. Must be owner/repo.');
    }

    const repoInfo = await this.githubFetch(`/repos/${owner}/${repo}`, token);
    if (!repoInfo) {
      throw new Error(`Repository ${fullName} not found or inaccessible.`);
    }

    if (repoInfo.archived) {
      throw new Error(`Repository ${fullName} is archived and cannot be audited.`);
    }

    // Size check (size is in KB, limit to 2000000 KB = 2GB for scanning safety)
    if (repoInfo.size > 2000000) {
      throw new Error(`Repository ${fullName} exceeds the maximum size limit for analysis.`);
    }

    return true;
  }

  // Step 2: Fetch Repository Metadata
  static async fetchMetadata(fullName: string, token: string): Promise<RepositoryMetadata> {
    const [owner, repo] = fullName.split('/');
    const repoInfo = await this.githubFetch(`/repos/${owner}/${repo}`, token);
    if (!repoInfo) {
      throw new Error(`Failed to load metadata for ${fullName}`);
    }

    // Fetch languages breakdown
    let languagesBreakdown: Record<string, number> = {};
    try {
      const languagesData = await this.githubFetch(`/repos/${owner}/${repo}/languages`, token);
      if (languagesData) {
        languagesBreakdown = languagesData;
      }
    } catch (err) {
      console.warn('Could not fetch language breakdown:', err);
    }

    return {
      owner: repoInfo.owner?.login || owner,
      defaultBranch: repoInfo.default_branch || 'main',
      languagesBreakdown,
      openIssues: repoInfo.open_issues_count || 0,
      createdAt: repoInfo.created_at,
      updatedAt: repoInfo.updated_at,
      topics: repoInfo.topics || [],
    };
  }

  // Step 3 & 4: Recursive File Discovery and Smart Selection
  static async selectImportantFiles(
    fullName: string,
    defaultBranch: string,
    token: string
  ): Promise<{ readme: string | null; packageJson: any | null; files: { path: string; content: string }[] }> {
    const [owner, repo] = fullName.split('/');
    
    // Get full recursive repository tree
    const treeData = await this.githubFetch(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, token);
    if (!treeData || !Array.isArray(treeData.tree)) {
      return { readme: null, packageJson: null, files: [] };
    }

    const excludedDirs = ['node_modules', 'dist', 'build', '.next', 'out', 'coverage', 'vendor', '.git', '.github/workflows'];
    const excludedExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mov', '.zip', '.pdf', '.svg', '.ico', 
      '.lock', '-lock.json', '.lock.yaml', '.woff', '.woff2', '.eot', '.ttf', '.mp3', '.wav'
    ];

    const sourceExtensions = [
      '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', 
      '.cpp', '.h', '.cs', '.php', '.rb', '.swift', '.kt', '.html', '.css', '.yml', '.yaml', '.json'
    ];

    // Filter paths
    const filteredNodes = treeData.tree.filter((node: any) => {
      if (node.type !== 'blob') return false;
      const pathLower = node.path.toLowerCase();

      const inExcludedDir = excludedDirs.some(dir => 
        pathLower.startsWith(`${dir}/`) || pathLower.includes(`/${dir}/`)
      );
      if (inExcludedDir) return false;

      const hasExcludedExt = excludedExtensions.some(ext => pathLower.endsWith(ext));
      if (hasExcludedExt) return false;

      return sourceExtensions.some(ext => pathLower.endsWith(ext));
    });

    // Scoring weights for smart file selection
    const getFileScore = (path: string) => {
      const pathLower = path.toLowerCase();
      if (pathLower === 'readme.md') return 1000;
      if (pathLower === 'package.json') return 950;
      if (pathLower === 'tsconfig.json') return 900;
      if (pathLower.includes('drizzle.config') || pathLower.includes('prisma/schema')) return 850;
      if (pathLower.includes('next.config') || pathLower.includes('vite.config')) return 800;
      if (pathLower.includes('tailwind.config')) return 700;
      if (pathLower.startsWith('app/') || pathLower.startsWith('src/app/')) return 600;
      if (pathLower.startsWith('components/') || pathLower.includes('/components/')) return 500;
      if (pathLower.startsWith('services/') || pathLower.includes('/services/')) return 400;
      if (pathLower.startsWith('lib/') || pathLower.includes('/lib/')) return 350;
      if (pathLower.startsWith('features/') || pathLower.includes('/features/')) return 300;
      
      // Default score for standard source code files
      return 100;
    };

    // Sort by importance score descending, then by size ascending (to maximize coverage within token budget)
    const sortedNodes = filteredNodes
      .map((node: any) => ({
        ...node,
        score: getFileScore(node.path),
      }))
      .sort((a, b) => b.score - a.score || a.size - b.size);

    let totalSizeBytes = 0;
    const finalFiles: { path: string; content: string }[] = [];
    let readme: string | null = null;
    let packageJson: any | null = null;

    // We cap total file content fetched at 400 KB to leave budget for metadata, commits, etc.
    const MAX_FILES_SIZE = 400 * 1024;

    for (const node of sortedNodes) {
      if (totalSizeBytes >= MAX_FILES_SIZE) break;

      try {
        const fileData = await this.githubFetch(`/repos/${owner}/${repo}/contents/${node.path}`, token);
        if (fileData && fileData.content) {
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
          const pathLower = node.path.toLowerCase();

          if (pathLower === 'readme.md') {
            readme = content;
          } else if (pathLower === 'package.json') {
            try {
              packageJson = JSON.parse(content);
            } catch {}
          } else {
            // Smart select: only take top source files (up to 20 files)
            if (finalFiles.length < 20) {
              const fileLength = content.length;
              if (totalSizeBytes + fileLength > MAX_FILES_SIZE) {
                // Truncate file content
                const remaining = MAX_FILES_SIZE - totalSizeBytes;
                if (remaining > 500) {
                  finalFiles.push({
                    path: node.path,
                    content: content.slice(0, remaining) + '\n\n[Content truncated due to payload budget constraints]',
                  });
                  totalSizeBytes += remaining;
                }
              } else {
                finalFiles.push({
                  path: node.path,
                  content,
                });
                totalSizeBytes += fileLength;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Error reading file: ${node.path}`, err);
      }
    }

    return { readme, packageJson, files: finalFiles };
  }

  // Step 5: Commit Analysis
  static async analyzeCommits(fullName: string, token: string): Promise<CommitActivityStats> {
    const [owner, repo] = fullName.split('/');
    const commitsData = await this.githubFetch(`/repos/${owner}/${repo}/commits?per_page=20`, token);

    if (!Array.isArray(commitsData) || commitsData.length === 0) {
      return {
        commits: [],
        uniqueContributors: 0,
        firstCommitDate: null,
        latestCommitDate: null,
        commitFrequencyPerWeek: 0,
      };
    }

    const commits: CommitActivityInfo[] = commitsData.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author?.name || c.commit.committer?.name || 'Unknown',
      date: c.commit.author?.date || c.commit.committer?.date || '',
    }));

    const uniqueAuthors = new Set(commits.map(c => c.author));
    const dates = commits.map(c => new Date(c.date).getTime()).sort((a, b) => a - b);
    const firstCommitDate = dates.length > 0 ? new Date(dates[0]).toISOString() : null;
    const latestCommitDate = dates.length > 0 ? new Date(dates[dates.length - 1]).toISOString() : null;

    // Calculate frequency per week based on retrieved window (20 commits)
    let commitFrequencyPerWeek = 0;
    if (dates.length > 1) {
      const diffMs = dates[dates.length - 1] - dates[0];
      const diffWeeks = diffMs / (1000 * 60 * 60 * 24 * 7);
      if (diffWeeks > 0) {
        commitFrequencyPerWeek = Math.round((dates.length / diffWeeks) * 10) / 10;
      } else {
        commitFrequencyPerWeek = dates.length; // all in less than a week
      }
    } else {
      commitFrequencyPerWeek = dates.length;
    }

    return {
      commits,
      uniqueContributors: uniqueAuthors.size,
      firstCommitDate,
      latestCommitDate,
      commitFrequencyPerWeek,
    };
  }

  // Step 7: Architecture and Heuristics Summary Generator
  static generateArchitectureSummary(
    readme: string | null,
    packageJson: any | null,
    files: { path: string }[],
    languages: Record<string, number>,
    commitStats: CommitActivityStats
  ): ArchitectureSummary {
    const dependencies = {
      ...packageJson?.dependencies,
      ...packageJson?.devDependencies,
    };

    // Framework detection
    let framework = 'Vanish JS / Static';
    if (dependencies['next']) framework = 'Next.js';
    else if (dependencies['nuxt']) framework = 'Nuxt';
    else if (dependencies['@remix-run/react']) framework = 'Remix';
    else if (dependencies['astro']) framework = 'Astro';
    else if (dependencies['gatsby']) framework = 'Gatsby';
    else if (dependencies['react'] && dependencies['vite']) framework = 'React (Vite)';
    else if (dependencies['vue'] && dependencies['vite']) framework = 'Vue (Vite)';
    else if (dependencies['express']) framework = 'Express.js';
    else if (dependencies['@nestjs/core']) framework = 'NestJS';
    else if (dependencies['koa']) framework = 'Koa.js';

    // Languages listing
    const detectedLanguages = Object.keys(languages);

    // Key libraries list
    const majorLibs = [
      'drizzle-orm', 'prisma', 'tailwindcss', 'framer-motion', '@tanstack/react-query', 
      'redux', 'graphql', 'apollo-client', 'zod', 'typescript', 'webpack', 'vite', 
      'jest', 'vitest', 'cypress', 'playwright', 'mongoose', 'sequelize'
    ];
    const libraries = majorLibs.filter(lib => !!dependencies[lib]);

    // Project Type heuristic
    let projectType: ArchitectureSummary['projectType'] = 'Unknown';
    const hasFrontend = !!(dependencies['react'] || dependencies['vue'] || dependencies['svelte'] || dependencies['html'] || dependencies['next']);
    const hasBackend = !!(dependencies['express'] || dependencies['koa'] || dependencies['@nestjs/core'] || dependencies['fastify'] || dependencies['postgres'] || dependencies['pg'] || dependencies['mysql']);
    
    if (hasFrontend && hasBackend) {
      projectType = 'Fullstack';
    } else if (hasFrontend) {
      projectType = 'Frontend';
    } else if (hasBackend) {
      projectType = 'Backend';
    } else if (packageJson?.name?.startsWith('@') || readme?.toLowerCase().includes('library') || readme?.toLowerCase().includes('package')) {
      projectType = 'Library';
    }

    // Complexity heuristic (based on number of dependencies and language counts)
    const depCount = Object.keys(dependencies).length;
    let complexity: ArchitectureSummary['complexity'] = 'Medium';
    if (depCount < 10 && files.length < 8) {
      complexity = 'Low';
    } else if (depCount > 35 || files.length >= 20) {
      complexity = 'High';
    }

    // Folder structure detection
    const paths = files.map(f => f.path);
    const folders = new Set<string>();
    paths.forEach(p => {
      const parts = p.split('/');
      if (parts.length > 1) {
        folders.add(parts[0]);
      }
    });
    const folderStructure = Array.from(folders).slice(0, 10);

    // Development activity rating
    let developmentActivity: ArchitectureSummary['developmentActivity'] = 'Low';
    if (commitStats.commitFrequencyPerWeek > 5) {
      developmentActivity = 'High';
    } else if (commitStats.commitFrequencyPerWeek >= 1) {
      developmentActivity = 'Medium';
    }

    return {
      framework,
      languages: detectedLanguages,
      libraries,
      projectType,
      complexity,
      folderStructure,
      developmentActivity,
    };
  }

  // Master execution logic
  static async runAnalysis(
    repositoryId: string,
    fullName: string,
    gitToken: string
  ): Promise<{ summary: ArchitectureSummary; context: AnalyzerContext }> {
    // 1. Validation
    await this.validateRepository(fullName, gitToken);

    // 2. Fetch Metadata
    const metadata = await this.fetchMetadata(fullName, gitToken);

    // 3. Fetch Files
    const { readme, packageJson, files } = await this.selectImportantFiles(
      fullName,
      metadata.defaultBranch,
      gitToken
    );

    // 4. Fetch Commits
    const commitStats = await this.analyzeCommits(fullName, gitToken);

    // 5. Generate Summary
    const summary = this.generateArchitectureSummary(
      readme,
      packageJson,
      files,
      metadata.languagesBreakdown,
      commitStats
    );

    // Create complete context payload
    const context: AnalyzerContext = {
      metadata,
      readme,
      packageJson,
      topSourceFiles: files,
      commits: commitStats.commits,
      languagesBreakdown: metadata.languagesBreakdown,
    };

    return {
      summary,
      context,
    };
  }
}
