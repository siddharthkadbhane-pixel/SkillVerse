import { TrustWeights } from './types';

export const TRUST_ENGINE_VERSION = '1.0.0';

// Configurable weights for Trust Score categories (must sum to 1.0)
export const DEFAULT_TRUST_WEIGHTS: TrustWeights = {
  codeQuality: 0.25,      // 25% weight
  maintainability: 0.15,  // 15% weight
  security: 0.20,         // 20% weight
  performance: 0.10,      // 10% weight
  testing: 0.10,          // 10% weight
  gitActivity: 0.10,      // 10% weight
  documentation: 0.10,    // 10% weight
};
