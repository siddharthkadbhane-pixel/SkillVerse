import { SkillIntelligenceService } from '../services/capability/engine';
import { CapabilityMappingService, CAPABILITY_TAXONOMY } from '../services/capability/mapping';
import { DeveloperCapabilityCardService } from '../services/dcc/service';
import { DeveloperSearchService } from '../services/discovery/search';
import { TrustCalculatorService } from '../services/trust/calculator';

async function runSkillIntelligenceTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 28: SKILL INTELLIGENCE & CAPABILITY MAPPING TEST SUITE');
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

  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
  const EMPTY_USER_ID = '00000000-0000-0000-0000-999999999999';

  try {
    // TEST 1: Capability Taxonomy Definitions
    console.log('\n--- 1. Testing Capability Taxonomy Registry ---');
    const taxonomies = CapabilityMappingService.getAllTaxonomies();
    assert(taxonomies.length >= 10, `Registered ${taxonomies.length} core engineering capabilities in taxonomy`);
    assert(!!CAPABILITY_TAXONOMY['Frontend Engineering'], 'Frontend Engineering taxonomy defined');
    assert(!!CAPABILITY_TAXONOMY['Backend Engineering'], 'Backend Engineering taxonomy defined');
    assert(!!CAPABILITY_TAXONOMY['Database Engineering'], 'Database Engineering taxonomy defined');
    assert(!!CAPABILITY_TAXONOMY['Software Architecture'], 'Software Architecture taxonomy defined');

    // TEST 2: Controlled Skill-to-Capability Mappings
    console.log('\n--- 2. Testing Skill -> Capability Mappings ---');
    const reactCaps = CapabilityMappingService.getCapabilitiesForSkill('React');
    assert(reactCaps.includes('Frontend Engineering'), `React maps to Frontend Engineering (${reactCaps.join(', ')})`);

    const nodeCaps = CapabilityMappingService.getCapabilitiesForSkill('Node.js');
    assert(nodeCaps.includes('Backend Engineering'), `Node.js maps to Backend Engineering (${nodeCaps.join(', ')})`);

    const postgresCaps = CapabilityMappingService.getCapabilitiesForSkill('PostgreSQL');
    assert(postgresCaps.includes('Database Engineering'), `PostgreSQL maps to Database Engineering (${postgresCaps.join(', ')})`);

    const dockerCaps = CapabilityMappingService.getCapabilitiesForSkill('Docker');
    assert(dockerCaps.includes('DevOps & Infrastructure'), `Docker maps to DevOps (${dockerCaps.join(', ')})`);

    // TEST 3: Capability Calculation from Codebase Audits & Skills
    console.log('\n--- 3. Testing Capability Calculation & Levels ---');
    const caps = await SkillIntelligenceService.calculateDeveloperCapabilities(TEST_USER_ID);
    assert(Array.isArray(caps) && caps.length > 0, `Calculated ${caps.length} capabilities for developer`);
    
    // Check Frontend / Full-Stack capability
    const feCap = caps.find(c => c.capabilityName.includes('Frontend') || c.capabilityName.includes('Full-Stack'));
    assert(!!feCap, 'Frontend or Full-Stack capability generated');
    if (feCap) {
      assert(
        feCap.level === 'Strong' || feCap.level === 'Proficient',
        `Evidence-backed capability level: ${feCap.level}`
      );
      assert(feCap.analyzedProjectsCount >= 1, `Analyzed projects counted: ${feCap.analyzedProjectsCount}`);
      assert(feCap.confidenceScore >= 70, `Confidence score: ${feCap.confidenceScore}%`);
      assert(feCap.supportingSkills.length >= 1, `Supporting skills: ${feCap.supportingSkills.join(', ')}`);
    }

    // TEST 4: Core Principle: Technology != Automatic Mastery (No Exaggerated Expert)
    console.log('\n--- 4. Testing Anti-Exaggeration Guard ---');
    caps.forEach(c => {
      assert(
        ['Strong', 'Proficient', 'Developing', 'Emerging'].includes(c.level),
        `Level strictly adheres to grounded tiers (${c.capabilityName}: ${c.level})`
      );
      assert((c.level as any) !== 'Master' && (c.level as any) !== 'Guru', 'Avoids marketing hyperbole');
    });

    // TEST 5: Verification State Classification
    console.log('\n--- 5. Testing Verification States ---');
    const verifiedCap = caps.find(c => c.verificationState === 'verified');
    assert(!!verifiedCap, `Found verified capability (${verifiedCap?.capabilityName} - ${verifiedCap?.verificationState})`);
    caps.forEach(c => {
      assert(
        ['verified', 'supported', 'detected', 'insufficient_evidence'].includes(c.verificationState),
        `Valid verification state on ${c.capabilityName}: ${c.verificationState}`
      );
    });

    // TEST 6: Explainability ("Why this capability level?")
    console.log('\n--- 6. Testing Explainability String Generation ---');
    caps.forEach(c => {
      assert(typeof c.whyExplanation === 'string' && c.whyExplanation.length > 20, `Explainability statement present for ${c.capabilityName}`);
      assert(
        c.whyExplanation.includes('audited') || c.whyExplanation.includes('analyzed') || c.whyExplanation.includes('implementation') || c.whyExplanation.includes('Detected'),
        `Explainability is evidence-grounded: "${c.whyExplanation}"`
      );
    });

    // TEST 7: DCC Integration (Payload Structure)
    console.log('\n--- 7. Testing DCC Integration ---');
    const fullDCC = await DeveloperCapabilityCardService.getFullDCC(TEST_USER_ID);
    assert(Array.isArray(fullDCC.engineeringCapabilities), 'DCC contains engineeringCapabilities array');
    assert(fullDCC.engineeringCapabilities!.length > 0, `DCC has ${fullDCC.engineeringCapabilities!.length} capabilities`);

    // TEST 8: Public DCC Sanitization
    console.log('\n--- 8. Testing Public DCC Sanitization ---');
    const publicDCC = await DeveloperCapabilityCardService.getPublicDCC('siddharthkadbhane-pixel');
    assert(publicDCC !== null, 'Public DCC resolved successfully');
    if (publicDCC?.engineeringCapabilities) {
      assert(
        publicDCC.engineeringCapabilities.every((c: any) => !c.id.includes('secret') && typeof c.whyExplanation === 'string'),
        'Public capabilities sanitized with clean explainability'
      );
    }

    // TEST 9: Private Profile Shielding
    console.log('\n--- 9. Testing Private Profile Protection ---');
    const privateCaps = await SkillIntelligenceService.getPublicDeveloperCapabilities('private-non-existent-user');
    assert(privateCaps.length === 0, 'Private profile returns empty array');

    // TEST 10: Developer Discovery Capability Matching
    console.log('\n--- 10. Testing Developer Discovery Integration ---');
    const searchRes = await DeveloperSearchService.searchDevelopers({ q: 'Backend Engineering' });
    assert(searchRes && Array.isArray(searchRes.developers) && searchRes.developers.length > 0, 'Discovery search matches on capability queries');
    if (searchRes.developers.length > 0) {
      assert(searchRes.developers[0].topVerifiedSkills.length > 0, `Top matched developer: @${searchRes.developers[0].username}`);
    }

    // TEST 11: Empty / New Developer Fallback
    console.log('\n--- 11. Testing New Developer Empty State ---');
    const emptyCaps = await SkillIntelligenceService.calculateDeveloperCapabilities(EMPTY_USER_ID);
    assert(Array.isArray(emptyCaps), 'Empty developer returns safe array');

    // TEST 12: Scoring Safety & Trust Score Independence
    console.log('\n--- 12. Testing Scoring Safety ---');
    const trustDetails = await TrustCalculatorService.calculateUserTrustScore(TEST_USER_ID);
    assert(trustDetails.overallScore > 0 && trustDetails.overallScore <= 1000, `Trust Score remains unaffected: ${trustDetails.overallScore}/1000`);

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

runSkillIntelligenceTests().catch(console.error);
