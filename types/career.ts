// Phase 35: AI Career & Learning Intelligence Domain Contracts

import { CapabilityCategoryName, EngineeringCapabilityLevel } from './capability';

export type CareerRoleId =
  | 'frontend_developer'
  | 'backend_developer'
  | 'fullstack_developer'
  | 'mobile_developer'
  | 'devops_engineer'
  | 'cloud_engineer'
  | 'data_engineer'
  | 'ai_ml_engineer'
  | 'security_engineer'
  | 'qa_test_engineer';

export type CareerRoleCategory =
  | 'Application Development'
  | 'Infrastructure & Operations'
  | 'Data & Artificial Intelligence'
  | 'Quality & Security';

export type CareerReadinessTier = 'Ready' | 'Developing' | 'Emerging' | 'Early Stage';

export type CareerMilestoneIntent =
  | 'Prepare for First Job'
  | 'Prepare for Internship'
  | 'Become a Specialist'
  | 'Promote to Senior Engineer'
  | 'Improve System Design'
  | 'Become an Open Source Contributor'
  | 'Custom Milestone';

export type GapPriority = 'Critical Gap' | 'Growth Area' | 'Complementary Skill';

export type TaskCadence = 'daily' | 'weekly' | 'monthly';

export type TaskType = 'skill_practice' | 'project_build' | 'challenge' | 'architecture_study';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface CareerRoleTaxonomy {
  id: CareerRoleId;
  name: string;
  category: CareerRoleCategory;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  standardStack: string[];
  requiredCapabilities: {
    capabilityName: CapabilityCategoryName;
    minLevel: EngineeringCapabilityLevel;
    weight: number; // 1 - 5
    description: string;
  }[];
  preferredCapabilities: {
    capabilityName: CapabilityCategoryName;
    preferredLevel: EngineeringCapabilityLevel;
    weight: number;
    description: string;
  }[];
  coreSkillsRequired: string[];
  recommendedSkills: string[];
  typicalToolchain: string[];
}

export interface RoleFitAnalysis {
  roleId: CareerRoleId;
  roleName: string;
  category: CareerRoleCategory;
  fitScore: number; // 0 - 100
  readinessTier: CareerReadinessTier;
  summary: string;
  strengths: {
    capabilityName: string;
    level: EngineeringCapabilityLevel;
    confidenceScore: number;
    verifiedSkills: string[];
    evidenceRepos: string[];
    whyExplanation: string;
  }[];
  gaps: SkillGapItem[];
  missingSkills: string[];
  recommendedNextStep: string;
  disclaimer: string;
}

export interface SkillGapItem {
  id: string;
  capabilityName: CapabilityCategoryName | string;
  priority: GapPriority;
  currentLevel: EngineeringCapabilityLevel | 'Not Detected';
  targetLevel: EngineeringCapabilityLevel;
  whyExplanation: string;
  missingSkills: string[];
  recommendedAction: string;
  suggestedProjectIdea?: string;
  matchingChallengeId?: string;
}

export interface CareerGoal {
  id: string;
  userId: string;
  targetRoleId: CareerRoleId;
  targetRoleName: string;
  customGoalTitle?: string;
  milestoneIntent: CareerMilestoneIntent;
  targetTimeframe: string; // e.g. '3 Months', '6 Months', '1 Year'
  targetCapabilityLevel: EngineeringCapabilityLevel;
  focusSkills: string[];
  isPublic: boolean;
  status: 'active' | 'achieved' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapStage {
  stageNumber: number;
  stageTitle: string;
  objective: string;
  focusCapabilities: string[];
  targetSkills: string[];
  suggestedActivities: string[];
  recommendedProject: {
    title: string;
    description: string;
    recommendedStack: string[];
    verificationChecklist: string[];
  };
  linkedChallenge?: {
    id: string;
    title: string;
    difficulty: string;
    reward?: string;
  };
  linkedOpportunity?: {
    id: string;
    title: string;
    company: string;
    type: string;
  };
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CareerRoadmap {
  id: string;
  userId: string;
  goalId: string;
  targetRoleId: CareerRoleId;
  targetRoleName: string;
  title: string;
  overviewSummary: string;
  overallFitPercent: number;
  readinessTier: CareerReadinessTier;
  stages: RoadmapStage[];
  stateHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningTask {
  id: string;
  userId: string;
  goalId?: string;
  roadmapId?: string;
  stageNumber?: number;
  title: string;
  description: string;
  cadence: TaskCadence;
  taskType: TaskType;
  targetSkill?: string;
  targetCapability?: string;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
}

export interface ProjectRecommendation {
  id: string;
  title: string;
  description: string;
  targetCapability: string;
  gapAddressed: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  techStack: string[];
  estimatedHours: number;
  architectureHighlights: string[];
  whyRecommended: string;
}

export interface CareerRecommendations {
  targetRoleId: CareerRoleId;
  projects: ProjectRecommendation[];
  challenges: any[];
  opportunities: any[];
  aiGuidance?: {
    careerDirectionExplanation: string;
    growthStrategy: string;
    suggestedLearningSequence: string[];
    cachedAt: string;
  };
}

export interface CareerProgress {
  userId: string;
  activeGoal: CareerGoal | null;
  currentRoadmap: CareerRoadmap | null;
  readinessTier: CareerReadinessTier;
  fitScore: number;
  completedTasksCount: number;
  totalTasksCount: number;
  dailyCompleted: number;
  weeklyCompleted: number;
  monthlyCompleted: number;
  streakDays: number;
  recentMilestones: {
    title: string;
    date: string;
    type: string;
    evidenceRepo?: string;
  }[];
  lastEvaluatedAt: string;
}

export interface CareerOverviewData {
  goal: CareerGoal | null;
  activeRoleFit: RoleFitAnalysis | null;
  allRoleFits: RoleFitAnalysis[];
  topGaps: SkillGapItem[];
  roadmap: CareerRoadmap | null;
  tasks: LearningTask[];
  recommendations: CareerRecommendations | null;
  progress: CareerProgress;
}
