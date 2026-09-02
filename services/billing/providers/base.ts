// SkillVerse Billing Provider Abstraction (Phase 39)

import {
  CreateCustomerParams,
  CreateCheckoutParams,
  BillingCustomerResult,
  CheckoutSessionResult,
  SubscriptionDetails,
  BillingWebhookEventResult,
} from '@/types/billing';

export interface BillingProvider {
  readonly name: string;
  createCustomer(params: CreateCustomerParams): Promise<{ customerId: string; email: string }>;
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult>;
  getSubscription(subscriptionId: string): Promise<SubscriptionDetails | null>;
  cancelSubscription(subscriptionId: string, atPeriodEnd?: boolean): Promise<SubscriptionDetails>;
  handleWebhook(payload: any, signature: string, secret?: string): Promise<BillingWebhookEventResult>;
}

export class BillingProviderRegistry {
  private static providers = new Map<string, BillingProvider>();
  private static activeProviderName = 'mock';

  public static register(provider: BillingProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  public static getActiveProvider(): BillingProvider {
    const provider = this.providers.get(this.activeProviderName.toLowerCase());
    if (!provider) {
      throw new Error(`Billing provider "${this.activeProviderName}" is not registered.`);
    }
    return provider;
  }

  public static getProvider(name: string): BillingProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  public static setActiveProvider(name: string): void {
    if (!this.providers.has(name.toLowerCase())) {
      throw new Error(`Cannot set active billing provider: "${name}" is not registered.`);
    }
    this.activeProviderName = name.toLowerCase();
  }
}
