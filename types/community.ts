export type CommunityContentType = 
  | 'project_showcase'
  | 'technical_discussion'
  | 'question'
  | 'progress_update'
  | 'code_help'
  | 'open_source_request'
  | 'tutorial'
  | 'challenge_result';

export type QuestionStatus = 'open' | 'answered' | 'closed';
export type PeerReviewStatus = 'requested' | 'reviewing' | 'completed' | 'closed';

export interface AuthorProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  dccLevel?: string;
  overallScore?: number;
  topSkills?: string[];
  communityReputationScore?: number;
}

export interface CommunityCommentItem {
  id: string;
  postId: string;
  authorId: string;
  author: AuthorProfile;
  content: string;
  codeSnippet?: string;
  upvotesCount: number;
  hasUpvoted?: boolean;
  createdAt: string;
}

export interface CommunityPostItem {
  id: string;
  authorId: string;
  author: AuthorProfile;
  title: string;
  content: string;
  contentType: CommunityContentType;
  tags: string[];
  codeSnippet?: string;
  repositoryUrl?: string;
  liveDemoUrl?: string;
  challengeId?: string;
  upvotesCount: number;
  commentsCount: number;
  hasUpvoted?: boolean;
  isBookmarked?: boolean;
  comments?: CommunityCommentItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityAnswerItem {
  id: string;
  questionId: string;
  authorId: string;
  author: AuthorProfile;
  content: string;
  codeSnippet?: string;
  isAccepted: boolean;
  upvotesCount: number;
  hasUpvoted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityQuestionItem {
  id: string;
  authorId: string;
  author: AuthorProfile;
  title: string;
  content: string;
  tags: string[];
  codeSnippet?: string;
  status: QuestionStatus;
  acceptedAnswerId?: string;
  answersCount: number;
  upvotesCount: number;
  hasUpvoted?: boolean;
  answers?: CommunityAnswerItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface PeerReviewResponseItem {
  id: string;
  requestId: string;
  reviewerId: string;
  reviewer: AuthorProfile;
  architectureScore: number; // 0-100
  codeQualityScore: number;  // 0-100
  securityScore: number;     // 0-100
  testingScore: number;      // 0-100
  feedbackNotes: string;
  suggestedImprovements?: string[];
  createdAt: string;
}

export interface PeerReviewRequestItem {
  id: string;
  requesterId: string;
  requester: AuthorProfile;
  title: string;
  description: string;
  repositoryUrl: string;
  branchOrCommit?: string;
  focusAreas: string[]; // e.g. ['Performance', 'Concurrency', 'Security']
  status: PeerReviewStatus;
  responsesCount: number;
  responses?: PeerReviewResponseItem[];
  createdAt: string;
}

export interface OpenSourceOpportunityItem {
  id: string;
  authorId: string;
  author: AuthorProfile;
  title: string;
  description: string;
  repositoryUrl: string;
  issueUrl?: string;
  requiredSkills: string[];
  difficulty: 'Good First Issue' | 'Intermediate' | 'Complex';
  createdAt: string;
}

export interface CommunityReputationItem {
  userId: string;
  totalReputationPoints: number;
  acceptedAnswersCount: number;
  helpfulReviewsCount: number;
  technicalWriteupsCount: number;
  verifiedContributionsCount: number;
  badgeLevel: 'Contributor' | 'Mentor' | 'Architect' | 'Luminary';
}

export interface CommunityFilter {
  q?: string;
  contentType?: CommunityContentType | 'all';
  tag?: string;
  status?: QuestionStatus | 'all';
  authorUsername?: string;
  onlyFollowing?: boolean;
}

export interface CommunityReportItem {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'question' | 'answer' | 'user';
  targetId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface CommunityBlockItem {
  id: string;
  userId: string;
  blockedUserId: string;
  createdAt: string;
}
