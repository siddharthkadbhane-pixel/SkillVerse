export interface TrustCategoryScores {
  codeQuality: number;
  maintainability: number;
  security: number;
  performance: number;
  testing: number;
  gitActivity: number;
  documentation: number;
}

export interface TrustWeights {
  codeQuality: number;
  maintainability: number;
  security: number;
  performance: number;
  testing: number;
  gitActivity: number;
  documentation: number;
}

export interface ImprovementSuggestion {
  category: keyof TrustCategoryScores;
  message: string;
  score: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface TrustScoreDetails {
  overallScore: number; // 0 to 1000
  categoryScores: TrustCategoryScores;
  weightValues: TrustWeights;
  confidence: number; // 0 to 100
  engineVersion: string;
  explanation: string;
  suggestions: ImprovementSuggestion[];
}
