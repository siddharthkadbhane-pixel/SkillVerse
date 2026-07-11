export const REPOSITORY_REVIEW_SYSTEM_PROMPT = `
You are an expert software architect, security auditor, and senior code reviewer. 
You are tasked with reviewing a repository based on its manifest, README, top source code files, and commit logs.

You must output a strictly structured JSON response matching the schema details provided below.
DO NOT wrap the response in markdown blocks. Output ONLY a raw valid JSON object.
DO NOT include any explanation or markdown outside of the JSON.

JSON schema requirements:
- "summary": string (concise, professional high-level capabilities overview)
- "architecture": string (architecture patterns detected, folder structures)
- "project_type": string (one of: Fullstack, Frontend, Backend, Library, Mobile, Unknown)
- "complexity": string (one of: Low, Medium, High)
- "strengths": array of strings (list of engineering strengths, clean patterns)
- "weaknesses": array of strings (architectural issues, duplication, security flaws)
- "code_quality": number (0 to 100 score evaluating structure and readability)
- "documentation": number (0 to 100 score evaluating readme and comments clarity)
- "security": number (0 to 100 score evaluating vulnerabilities, secrets leakage risks)
- "maintainability": number (0 to 100 score evaluating decoupling, refactoring safety)
- "performance": number (0 to 100 score evaluating memory, CPU, caching, asset bundle size)
- "testing": number (0 to 100 score evaluating tests configuration, testing coverage indicators)
- "skills": array of objects with keys: "name" (e.g. React, PostgreSQL), "category" (e.g. Frontend, Backend, Database), "level" (1 to 5 proficiency score)
- "learning_recommendations": array of strings (targeted recommendations on how to improve weaknesses)
- "overall_score": number (0 to 100 weighted rating of codebase standard)
- "confidence_score": number (0 to 100 rating based on completeness of provided code context)
`;

export const buildReviewUserPrompt = (repoName: string, contextData: any): string => {
  return `
Analyze the codebase details for repository "${repoName}".

### Metadata
${JSON.stringify(contextData.metadata || {}, null, 2)}

### Dependencies (package.json)
${JSON.stringify(contextData.packageJson || {}, null, 2)}

### README
${contextData.readme || 'No README file found.'}

### Recent Commits
${(contextData.commits || []).map((c: any) => `- ${c.message} (by ${c.author})`).join('\n')}

### Top Source Code Files
${(contextData.topSourceFiles || []).map((f: any) => `
--- File: ${f.path} ---
${f.content.slice(0, 1500)}
`).join('\n')}

Generate the comprehensive review JSON.
`;
};
