import { CareerEngine } from '../services/career/engine';
import { DUMMY_USERS } from '../lib/dummyData';
import { CachingService } from '../lib/caching/service';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  const userId = DUMMY_USERS[0].id;
  console.log('=====================================================================');
  console.log('  📊 SKILLVERSE CAREER INTELLIGENCE ADVERSARIAL BENCHMARK');
  console.log('=====================================================================');
  console.log(`Target User: ${userId}`);

  // 1. Cold Run (Cold Cache + Cold Connection/Startup)
  CachingService.clear();
  console.log('\n▶ [1/3] Benchmarking Cold Request (Cache Cleared)...');
  const coldStart = performance.now();
  const coldData = await CareerEngine.getCareerOverview(userId);
  const coldDuration = performance.now() - coldStart;
  console.log(`  ⏱️  Cold Request Duration: ${coldDuration.toFixed(2)}ms (${(coldDuration / 1000).toFixed(2)}s)`);
  console.log(`  🎯 Target Role: ${coldData.goal?.targetRoleName}`);
  console.log(`  📈 Active Fit Score: ${coldData.activeRoleFit?.fitScore}`);
  console.log(`  📋 Tasks Count: ${coldData.tasks?.length}`);

  // 2. Warm In-Memory Cache Hit Runs (5 iterations)
  console.log('\n▶ [2/3] Benchmarking Warm In-Memory Cache Hits (5 iterations)...');
  const warmCacheDurations: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await CareerEngine.getCareerOverview(userId);
    warmCacheDurations.push(performance.now() - t0);
  }
  const minWarmCache = Math.min(...warmCacheDurations);
  const medWarmCache = median(warmCacheDurations);
  const maxWarmCache = Math.max(...warmCacheDurations);
  console.log(`  ⏱️  Warm Cache Hits -> Min: ${minWarmCache.toFixed(3)}ms | Median: ${medWarmCache.toFixed(3)}ms | Max: ${maxWarmCache.toFixed(3)}ms`);

  // 3. Warm DB-Backed Recalculation Runs (Connection warm, cache cleared each run, 3 iterations)
  console.log('\n▶ [3/3] Benchmarking Warm Database-Backed Recalculations (3 iterations)...');
  const dbRecalcDurations: number[] = [];
  for (let i = 0; i < 3; i++) {
    CachingService.clear();
    const t0 = performance.now();
    await CareerEngine.getCareerOverview(userId);
    const dur = performance.now() - t0;
    dbRecalcDurations.push(dur);
    console.log(`    - Run ${i + 1}: ${dur.toFixed(2)}ms (${(dur / 1000).toFixed(2)}s)`);
  }
  const minDbRecalc = Math.min(...dbRecalcDurations);
  const medDbRecalc = median(dbRecalcDurations);
  const maxDbRecalc = Math.max(...dbRecalcDurations);
  console.log(`  ⏱️  Warm DB Recalc -> Min: ${minDbRecalc.toFixed(2)}ms | Median: ${medDbRecalc.toFixed(2)}ms | Max: ${maxDbRecalc.toFixed(2)}ms`);

  console.log('\n=====================================================================');
  console.log('  🏁 BENCHMARK SUMMARY');
  console.log('=====================================================================');
  console.log(`  1. Cold Request (Fresh Startup):        ${coldDuration.toFixed(2)}ms (${(coldDuration / 1000).toFixed(2)}s)`);
  console.log(`  2. Warm DB-Backed Recalculation Median: ${medDbRecalc.toFixed(2)}ms (${(medDbRecalc / 1000).toFixed(2)}s)`);
  console.log(`  3. Warm In-Memory Cache Hit Median:     ${medWarmCache.toFixed(3)}ms`);
  console.log('=====================================================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Benchmark execution failed:', err);
  process.exit(1);
});
