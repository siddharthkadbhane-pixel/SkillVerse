interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CachingService {
  private static cache = new Map<string, CacheEntry<any>>();

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  static set<T>(key: string, value: T, ttlSeconds = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  static delete(key: string): void {
    this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }
}

export default CachingService;
