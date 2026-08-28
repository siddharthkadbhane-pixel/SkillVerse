import { DeveloperSearchService } from '../services/discovery/search';
import { DCCEvidenceService } from '../services/dcc/evidence';
import { DeveloperCapabilityCardService } from '../services/dcc/service';

async function runDeveloperDiscoveryTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 26: DEVELOPER DISCOVERY & SEARCH ENGINE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Default / Empty Query Search
    console.log('\n--- 1. Testing Default Developer Discovery Search ---');
    const defaultResults = await DeveloperSearchService.searchDevelopers({});
    assert(Array.isArray(defaultResults.developers), 'Returned developers array');
    assert(defaultResults.developers.length > 0, `Returned ${defaultResults.developers.length} public developers`);
    assert(defaultResults.pagination.totalCount >= defaultResults.developers.length, `Total count valid: ${defaultResults.pagination.totalCount}`);
    assert(defaultResults.pagination.page === 1, 'Default page is 1');
    assert(typeof defaultResults.meta.tookMs === 'number', `Query completed in ${defaultResults.meta.tookMs}ms`);

    // TEST 2: Search by Developer Name
    console.log('\n--- 2. Testing Search by Developer Name ---');
    const nameResults = await DeveloperSearchService.searchDevelopers({ q: 'Siddharth' });
    assert(nameResults.developers.length > 0, `Found ${nameResults.developers.length} developer(s) for name "Siddharth"`);
    const foundSiddharth = nameResults.developers.find(d => d.username === 'siddharthkadbhane-pixel');
    assert(!!foundSiddharth, 'Found Siddharth Kadbhane in results');
    if (foundSiddharth) {
      assert(foundSiddharth.name.includes('Siddharth'), `Name matches: ${foundSiddharth.name}`);
      assert(foundSiddharth.dccUrl === '/developer/siddharthkadbhane-pixel', `Direct DCC link correct: ${foundSiddharth.dccUrl}`);
    }

    // TEST 3: Search by Username
    console.log('\n--- 3. Testing Search by Username ---');
    const userResults = await DeveloperSearchService.searchDevelopers({ q: 'alex-chen' });
    assert(userResults.developers.length > 0, `Found developer for username "alex-chen"`);
    const foundAlex = userResults.developers.find(d => d.username === 'alex-chen');
    assert(!!foundAlex, 'Found Alex Chen profile');
    if (foundAlex) {
      assert(foundAlex.username === 'alex-chen', 'Username exact match verified');
      assert(foundAlex.dccUrl === '/developer/alex-chen', 'DCC URL is /developer/alex-chen');
    }

    // TEST 4: Search by Verified Skill ("TypeScript")
    console.log('\n--- 4. Testing Search by Verified Skill ("TypeScript") ---');
    const tsResults = await DeveloperSearchService.searchDevelopers({ q: 'TypeScript' });
    assert(tsResults.developers.length > 0, `Found ${tsResults.developers.length} developer(s) matching "TypeScript"`);
    tsResults.developers.forEach(dev => {
      const hasSkill = dev.topVerifiedSkills.some(s => s.name.toLowerCase().includes('typescript')) ||
                       dev.primaryTechnologies.some(t => t.toLowerCase().includes('typescript'));
      assert(hasSkill, `Developer @${dev.username} possesses TypeScript capability`);
    });

    // TEST 5: Search Relevance Scoring (Exact Verified Match > Generic match)
    console.log('\n--- 5. Testing Search Relevance Ranking ---');
    const reactResults = await DeveloperSearchService.searchDevelopers({ q: 'React' });
    assert(reactResults.developers.length > 0, `Found developers for "React"`);
    if (reactResults.developers.length > 1) {
      const firstDev = reactResults.developers[0];
      const secondDev = reactResults.developers[1];
      assert(
        (firstDev.relevanceScore || 0) >= (secondDev.relevanceScore || 0),
        `Ranked first developer (relevance: ${firstDev.relevanceScore}) higher than or equal to second (${secondDev.relevanceScore})`
      );
    }

    // TEST 6: Structured Skill Filter
    console.log('\n--- 6. Testing Structured Skill Filter ---');
    const rustFilter = await DeveloperSearchService.searchDevelopers({ skill: 'Rust' });
    assert(rustFilter.developers.length > 0, `Filtered developers with Rust skill (${rustFilter.developers.length} found)`);
    rustFilter.developers.forEach(dev => {
      const hasRust = dev.topVerifiedSkills.some(s => s.name.toLowerCase() === 'rust') ||
                      dev.primaryTechnologies.some(t => t.toLowerCase() === 'rust');
      assert(hasRust, `Developer @${dev.username} has verified Rust`);
    });

    // TEST 7: Verification Tier Distinction (Verified vs Supported vs Detected)
    console.log('\n--- 7. Testing Verification Tier Distinctions ---');
    const firstDev = defaultResults.developers[0];
    assert(Array.isArray(firstDev.topVerifiedSkills), 'Skills array present on card');
    const verifiedSkill = firstDev.topVerifiedSkills.find(s => s.status === 'verified');
    assert(!!verifiedSkill, `Found 'verified' skill: ${verifiedSkill?.name}`);
    if (verifiedSkill) {
      assert(typeof verifiedSkill.level === 'number', `Verified skill level: ${verifiedSkill.level}`);
      assert(typeof verifiedSkill.whyVerified === 'string', `Explainability reason present: "${verifiedSkill.whyVerified}"`);
    }

    // TEST 8: Capability Level Filter (e.g. "Elite")
    console.log('\n--- 8. Testing Capability Level Filter ---');
    const eliteResults = await DeveloperSearchService.searchDevelopers({ level: 'Elite' });
    assert(eliteResults.developers.length > 0, `Found ${eliteResults.developers.length} Elite developers`);
    eliteResults.developers.forEach(d => {
      assert(d.dccLevel === 'Elite', `Developer @${d.username} is Elite (level: ${d.dccLevel})`);
    });

    // TEST 9: Minimum Public Projects Filter
    console.log('\n--- 9. Testing Minimum Public Projects Filter ---');
    const minProjResults = await DeveloperSearchService.searchDevelopers({ minProjects: 3 });
    assert(minProjResults.developers.length > 0, `Found ${minProjResults.developers.length} developers with >= 3 projects`);
    minProjResults.developers.forEach(d => {
      assert(d.publicProjectCount >= 3, `Developer @${d.username} has ${d.publicProjectCount} >= 3 projects`);
    });

    // TEST 10: Sorting Options
    console.log('\n--- 10. Testing Sorting by Score and Verified Skills ---');
    const scoreSorted = await DeveloperSearchService.searchDevelopers({ sort: 'score' });
    for (let i = 0; i < scoreSorted.developers.length - 1; i++) {
      assert(
        scoreSorted.developers[i].overallScore >= scoreSorted.developers[i + 1].overallScore,
        `Score order preserved: ${scoreSorted.developers[i].overallScore} >= ${scoreSorted.developers[i + 1].overallScore}`
      );
    }

    const verifiedSkillsSorted = await DeveloperSearchService.searchDevelopers({ sort: 'verified_skills' });
    for (let i = 0; i < verifiedSkillsSorted.developers.length - 1; i++) {
      const aCount = verifiedSkillsSorted.developers[i].topVerifiedSkills.filter(s => s.status === 'verified').length;
      const bCount = verifiedSkillsSorted.developers[i + 1].topVerifiedSkills.filter(s => s.status === 'verified').length;
      assert(aCount >= bCount, `Verified skills count sorted: ${aCount} >= ${bCount}`);
    }

    // TEST 11: Pagination Handling
    console.log('\n--- 11. Testing Pagination ---');
    const page1 = await DeveloperSearchService.searchDevelopers({ page: 1, limit: 2 });
    assert(page1.developers.length <= 2, `Page 1 limit respected: ${page1.developers.length} items`);
    assert(page1.pagination.page === 1, 'Page 1 pagination confirmed');
    assert(page1.pagination.limit === 2, 'Limit 2 confirmed');

    if (page1.pagination.totalCount > 2) {
      const page2 = await DeveloperSearchService.searchDevelopers({ page: 2, limit: 2 });
      assert(page2.pagination.page === 2, 'Page 2 pagination confirmed');
      if (page2.developers.length > 0) {
        assert(page1.developers[0].id !== page2.developers[0].id, 'Page 1 and Page 2 contain distinct developer records');
      }
    }

    // TEST 12: Privacy Enforcement (Private Developer Exclusion)
    console.log('\n--- 12. Testing Privacy Protection and Private Profile Exclusion ---');
    // Ensure non-developer roles or private profiles are never included
    const recruiterInResults = defaultResults.developers.find(d => d.username === 'emily-recruiter');
    assert(!recruiterInResults, 'Recruiters and private profiles are excluded from developer discovery');

    // TEST 13: Data Sanitization (Zero Private Tokens/Emails/Internal IDs)
    console.log('\n--- 13. Testing Public Data Sanitization ---');
    defaultResults.developers.forEach(dev => {
      assert(!(dev as any).githubToken, `No github token on @${dev.username}`);
      assert(!(dev as any).email, `No email address exposed on @${dev.username}`);
      assert(!(dev as any).password, `No credentials exposed on @${dev.username}`);
      assert(typeof dev.username === 'string' && dev.username.length > 0, `Valid public username`);
      assert(typeof dev.dccUrl === 'string' && dev.dccUrl.startsWith('/developer/'), `Valid DCC link`);
    });

    // TEST 14: Empty State & No Matches Handling
    console.log('\n--- 14. Testing No Matches & Empty State ---');
    const emptyResults = await DeveloperSearchService.searchDevelopers({ q: 'NonExistentFrameworkXYZ12345' });
    assert(emptyResults.developers.length === 0, 'Returned 0 developers for non-existent query');
    assert(emptyResults.pagination.totalCount === 0, 'Total count is 0');
    assert(emptyResults.pagination.totalPages === 1, 'Total pages is 1');

    // TEST 15: Query Validation & Length Cap
    console.log('\n--- 15. Testing Query Parameter Resilience ---');
    const longQuery = 'a'.repeat(99);
    const longQueryResult = await DeveloperSearchService.searchDevelopers({ q: longQuery });
    assert(Array.isArray(longQueryResult.developers), 'Handled boundary length query safely');

    // TEST 16: Facets & Meta Information
    console.log('\n--- 16. Testing Discovery Meta & Facets ---');
    assert(Array.isArray(defaultResults.meta.availableSkills), 'Available skills facet list present');
    assert(Array.isArray(defaultResults.meta.availableCategories), 'Available categories facet list present');
    assert(Array.isArray(defaultResults.meta.availableLevels), 'Available levels facet list present');
    assert(defaultResults.meta.availableSkills.includes('TypeScript'), 'TypeScript included in popular facets');

  } catch (err: any) {
    console.error('❌ Exception in test suite:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDeveloperDiscoveryTests().catch(console.error);
