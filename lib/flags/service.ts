export type FeatureFlagState = 'enabled' | 'disabled' | 'experimental';

export interface FeatureFlagDefinition {
  key: string;
  name: string;
  description: string;
  state: FeatureFlagState;
  defaultValue: boolean;
}

const DEFAULT_FLAGS: Record<string, FeatureFlagDefinition> = {
  'dcc_v2_integrity': {
    key: 'dcc_v2_integrity',
    name: 'DCC 2.0 Evidence Integrity Engine',
    description: 'Enforces strict evidence hierarchy and conservative capability scoring.',
    state: 'enabled',
    defaultValue: true,
  },
  'provenance_tracking': {
    key: 'provenance_tracking',
    name: 'Repository Provenance & Fork Detection',
    description: 'Distinguishes original authorship, forks, and collaborative contributions.',
    state: 'enabled',
    defaultValue: true,
  },
  'fresher_empty_state': {
    key: 'fresher_empty_state',
    name: 'Fresher Empty State & Guidance',
    description: 'Provides honest, actionable guidance for developers with zero repositories.',
    state: 'enabled',
    defaultValue: true,
  },
  'dcc_audit_trail': {
    key: 'dcc_audit_trail',
    name: 'DCC Capability Audit Trail',
    description: 'Maintains immutable internal records of capability score transitions.',
    state: 'enabled',
    defaultValue: true,
  },
  'product_analytics_events': {
    key: 'product_analytics_events',
    name: 'Product Success Event Tracking',
    description: 'Logs core conversion and verification funnel events.',
    state: 'enabled',
    defaultValue: true,
  },
  'experimental_deep_similarity': {
    key: 'experimental_deep_similarity',
    name: 'Experimental Deep Code AST Similarity',
    description: 'Vector-based codebase similarity engine across multi-file architectures.',
    state: 'experimental',
    defaultValue: false,
  },
  'autonomous_ai_recruiter': {
    key: 'autonomous_ai_recruiter',
    name: 'Autonomous AI Recruiter',
    description: 'Automated candidate filtering without recruiter oversight (Deferred).',
    state: 'disabled',
    defaultValue: false,
  },
  'autonomous_ai_engineer': {
    key: 'autonomous_ai_engineer',
    name: 'Autonomous AI Engineer Agent',
    description: 'Automated software writing agent (Deferred).',
    state: 'disabled',
    defaultValue: false,
  },
};

export class FeatureFlagService {
  private static flagOverrides: Map<string, FeatureFlagState> = new Map();

  /**
   * Evaluates if a feature flag is active (enabled or experimental if allowed)
   */
  static isEnabled(flagKey: string, allowExperimental: boolean = false): boolean {
    const state = this.getFlagState(flagKey);
    if (state === 'enabled') return true;
    if (state === 'experimental' && allowExperimental) return true;
    return false;
  }

  /**
   * Retrieves current flag state ('enabled' | 'disabled' | 'experimental')
   */
  static getFlagState(flagKey: string): FeatureFlagState {
    if (this.flagOverrides.has(flagKey)) {
      return this.flagOverrides.get(flagKey)!;
    }

    const flag = DEFAULT_FLAGS[flagKey];
    if (flag) return flag.state;

    // Check environment variables e.g. FF_DCC_V2_INTEGRITY
    const envVar = `FF_${flagKey.toUpperCase().replace(/-/g, '_')}`;
    const envVal = process.env[envVar];
    if (envVal === 'true' || envVal === 'enabled') return 'enabled';
    if (envVal === 'false' || envVal === 'disabled') return 'disabled';
    if (envVal === 'experimental') return 'experimental';

    return 'disabled';
  }

  /**
   * Overrides flag state in memory (for testing or runtime toggles)
   */
  static setFlagOverride(flagKey: string, state: FeatureFlagState): void {
    this.flagOverrides.set(flagKey, state);
  }

  /**
   * Clears all flag overrides
   */
  static clearOverrides(): void {
    this.flagOverrides.clear();
  }

  /**
   * Lists all configured feature flags
   */
  static getAllFlags(): FeatureFlagDefinition[] {
    return Object.values(DEFAULT_FLAGS).map(flag => ({
      ...flag,
      state: this.getFlagState(flag.key),
    }));
  }
}

export default FeatureFlagService;
