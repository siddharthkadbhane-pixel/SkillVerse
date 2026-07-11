interface GitHubFile {
  path: string;
  size: number;
  content: string;
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoAnalysisData {
  readme: string | null;
  packageJson: any | null;
  topFiles: GitHubFile[];
  commits: CommitInfo[];
  totalSize: number;
}

export class GitHubService {
  private static BASE_URL = 'https://api.github.com';

  private static async githubFetch(endpoint: string, token: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/vnd.github.v3+json');
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('User-Agent', 'SkillVerse-AI-Agent');

    const res = await fetch(`${this.BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`GitHub API error [${res.status}]: ${res.statusText}`);
    }

    return res.json();
  }

  // Fetch README
  static async getReadme(owner: string, repo: string, token: string): Promise<string | null> {
    try {
      const data = await this.githubFetch(`/repos/${owner}/${repo}/readme`, token);
      if (!data || !data.content) return null;
      // GitHub content is base64 encoded
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }

  // Fetch package.json
  static async getPackageJson(owner: string, repo: string, token: string): Promise<any | null> {
    try {
      const data = await this.githubFetch(`/repos/${owner}/${repo}/contents/package.json`, token);
      if (!data || !data.content) return null;
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  // Fetch latest 10 commits
  static async getCommits(owner: string, repo: string, token: string): Promise<CommitInfo[]> {
    try {
      const commits = await this.githubFetch(`/repos/${owner}/${repo}/commits?per_page=10`, token);
      if (!Array.isArray(commits)) return [];
      
      return commits.map((c: any) => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name || c.commit.committer?.name || 'Unknown',
        date: c.commit.author?.date || c.commit.committer?.date || '',
      }));
    } catch {
      return [];
    }
  }

  // Fetch top 5 source files excluding build artifacts
  static async getTopSourceFiles(owner: string, repo: string, token: string): Promise<GitHubFile[]> {
    try {
      // Get repo tree recursively
      const repoInfo = await this.githubFetch(`/repos/${owner}/${repo}`, token);
      if (!repoInfo) return [];
      const defaultBranch = repoInfo.default_branch || 'main';

      const treeData = await this.githubFetch(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, token);
      if (!treeData || !Array.isArray(treeData.tree)) return [];

      // Filter for valid files
      const excludedDirs = ['node_modules', 'dist', 'build', '.next', 'out', 'bin', 'obj', 'vendor', '.git'];
      const excludedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mov', '.zip', '.pdf', '.svg', '.ico', '.lock'];

      const sourceFiles = treeData.tree
        .filter((node: any) => {
          if (node.type !== 'blob') return false;
          
          const pathLower = node.path.toLowerCase();
          
          // Check excluded dirs
          const inExcludedDir = excludedDirs.some(dir => 
            pathLower.startsWith(`${dir}/`) || pathLower.includes(`/${dir}/`)
          );
          if (inExcludedDir) return false;

          // Check excluded extensions
          const hasExcludedExt = excludedExtensions.some(ext => pathLower.endsWith(ext));
          if (hasExcludedExt) return false;

          // Check for source file extensions
          const validSourceExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', 
            '.cpp', '.h', '.cs', '.php', '.rb', '.swift', '.kt', '.html', '.css'
          ];
          return validSourceExtensions.some(ext => pathLower.endsWith(ext));
        })
        // Sort by size (ascending to get small-to-medium files that fit context, or descending to inspect heavy source files)
        // Let's sort descending but capping each file size to 100KB to make sure we get distinct files
        .filter((node: any) => node.size > 0 && node.size < 100000)
        .slice(0, 5); // Take top 5 source files

      const files: GitHubFile[] = [];

      for (const node of sourceFiles) {
        try {
          const fileData = await this.githubFetch(`/repos/${owner}/${repo}/contents/${node.path}`, token);
          if (fileData && fileData.content) {
            const rawContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
            files.push({
              path: node.path,
              size: node.size,
              content: rawContent,
            });
          }
        } catch (err) {
          console.warn(`Could not fetch file: ${node.path}`, err);
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  // Master fetch pipeline respecting < 500 KB limit
  static async fetchRepoDetailsForAnalysis(
    fullName: string, 
    token: string
  ): Promise<RepoAnalysisData> {
    const [owner, repo] = fullName.split('/');
    if (!owner || !repo) throw new Error('Invalid repository full name');

    const readme = await this.getReadme(owner, repo, token);
    const packageJson = await this.getPackageJson(owner, repo, token);
    const commits = await this.getCommits(owner, repo, token);
    const topFiles = await this.getTopSourceFiles(owner, repo, token);

    // Limit aggregated size to 500KB
    let totalSize = (readme?.length || 0) + (JSON.stringify(packageJson || {}).length || 0);
    const finalFiles: GitHubFile[] = [];

    for (const file of topFiles) {
      const fileSize = file.content.length;
      if (totalSize + fileSize > 500 * 1024) {
        // Truncate file content to fit remaining space
        const allowedSize = (500 * 1024) - totalSize;
        if (allowedSize > 1000) {
          finalFiles.push({
            path: file.path,
            size: allowedSize,
            content: file.content.slice(0, allowedSize) + '\n\n[Content truncated for analysis limitations]',
          });
          totalSize += allowedSize;
        }
        break;
      }
      finalFiles.push(file);
      totalSize += fileSize;
    }

    return {
      readme,
      packageJson,
      commits,
      topFiles: finalFiles,
      totalSize,
    };
  }
}
