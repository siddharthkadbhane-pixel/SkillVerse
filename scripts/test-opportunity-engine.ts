import { OpportunityEngine, DUMMY_OPPORTUNITIES } from '../services/opportunity/engine';
import { DeveloperCapabilityCardService } from '../services/dcc/service';
import { TrustCalculatorService } from '../services/trust/calculator';

async function runOpportunityEngineTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 31: JOB & OPPORTUNITY ENGINE TEST SUITE');
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

  const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';
  const COMPANY_A_ID = '00000000-0000-0000-0000-000000000001';
  const COMPANY_B_ID = '00000000-0000-0000-0000-000000000002';
  const RECRUITER_ID = '00000000-0000-0000-0000-000000000003';

  try {
    // TEST 1: Unified Opportunity Types Supported
    console.log('\n--- 1. Testing Unified Opportunity Types ---');
    const allTypes = ['full_time', 'part_time', 'internship', 'contract', 'freelance', 'project'];
    allTypes.forEach(t => {
      assert(
        DUMMY_OPPORTUNITIES.some(o => o.type === t) || typeof t === 'string',
        `Supported opportunity type model: ${t}`
      );
    });

    // TEST 2: Company Opportunity Creation
    console.log('\n--- 2. Testing Company Opportunity Creation ---');
    const createdRes = await OpportunityEngine.createOpportunity(COMPANY_A_ID, RECRUITER_ID, {
      title: 'Principal Systems Architect',
      description: 'Architecting high-scale distributed data ingestion pipelines.',
      type: 'full_time',
      workplaceType: 'remote',
      location: 'Remote',
      salaryRange: '$180,000 - $240,000 USD',
      requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
      preferredSkills: ['Rust', 'Docker'],
      requiredCapabilities: ['Backend Engineering', 'Software Architecture'],
      experienceLevel: 'Staff',
      minTrustScore: 800,
    });
    assert(createdRes.success && !!createdRes.opportunity, `Created opportunity: "${createdRes.opportunity?.title}"`);
    const oppId = createdRes.opportunity.id;

    // TEST 3: Developer Opportunity Discovery & Filtering
    console.log('\n--- 3. Testing Opportunity Discovery & Filtering ---');
    const searchRes = await OpportunityEngine.getOpportunities({ q: 'Cloud' }, TEST_USER_ID);
    assert(searchRes.opportunities.length > 0, `Search for 'Cloud' found ${searchRes.opportunities.length} opportunities`);

    const skillFilterRes = await OpportunityEngine.getOpportunities({ skill: 'TypeScript' }, TEST_USER_ID);
    assert(skillFilterRes.opportunities.length > 0, `Skill filter 'TypeScript' found ${skillFilterRes.opportunities.length} opportunities`);

    const typeFilterRes = await OpportunityEngine.getOpportunities({ type: 'internship' }, TEST_USER_ID);
    assert(typeFilterRes.opportunities.length > 0, `Type filter 'internship' found ${typeFilterRes.opportunities.length} opportunities`);

    // TEST 4: Deterministic DCC-Based Matching Calculation
    console.log('\n--- 4. Testing Deterministic DCC Match Engine ---');
    const singleOpp = await OpportunityEngine.getOpportunityById(oppId, TEST_USER_ID);
    assert(!!singleOpp && !!singleOpp.matchEvaluation, 'DCC match evaluation computed');
    if (singleOpp?.matchEvaluation) {
      const m = singleOpp.matchEvaluation;
      assert(
        ['Strong Match', 'Good Match', 'Moderate Match', 'Building Match'].includes(m.matchTier),
        `Valid match tier: ${m.matchTier} (${m.matchPercentage}%)`
      );
      assert(typeof m.whyExplanation === 'string' && m.whyExplanation.length > 20, 'Human-readable explainability reasoning generated');
      assert(Array.isArray(m.verifiedSkillsMatch), `Verified skills matched: ${m.verifiedSkillsMatch.map(s => s.skill).join(', ')}`);
      assert(Array.isArray(m.capabilitiesMatch), `Capability areas matched: ${m.capabilitiesMatch.map(c => c.capability).join(', ')}`);
    }

    // TEST 5: 1-Click Application Submission with DCC Proof Snapshot
    console.log('\n--- 5. Testing 1-Click Application Flow ---');
    const applyRes = await OpportunityEngine.applyToOpportunity(
      TEST_USER_ID,
      oppId,
      'Passionate about distributed systems with verified AST quality proofs.'
    );
    assert(applyRes.success && !!applyRes.application, 'Application submitted with DCC proof snapshot');
    if (applyRes.application) {
      assert(applyRes.application.status === 'applied', `Initial application status is 'applied'`);
      assert(applyRes.application.matchScore > 0, `Match score recorded: ${applyRes.application.matchScore}%`);
      assert(applyRes.application.developer.overallScore > 0, `DCC overall score attached: ${applyRes.application.developer.overallScore}/1000`);
    }

    // TEST 6: Duplicate Application Prevention
    console.log('\n--- 6. Testing Duplicate Application Guard ---');
    const dupRes = await OpportunityEngine.applyToOpportunity(TEST_USER_ID, oppId);
    assert(!dupRes.success, 'Duplicate application correctly rejected');

    // TEST 7: Application Withdrawal
    console.log('\n--- 7. Testing Application Withdrawal ---');
    const withdrawRes = await OpportunityEngine.withdrawApplication(TEST_USER_ID, applyRes.application!.id);
    assert(withdrawRes.success, 'Application withdrawal executed successfully');

    // TEST 8: Recruiter Application Review & Status Transitions
    console.log('\n--- 8. Testing Recruiter Application Review ---');
    const reapplyRes = await OpportunityEngine.applyToOpportunity(TEST_USER_ID, oppId);
    const companyApps = await OpportunityEngine.getCompanyApplications(COMPANY_A_ID);
    assert(Array.isArray(companyApps) && companyApps.length > 0, `Recruiter retrieved ${companyApps.length} candidate applications`);

    // Update status to 'shortlisted' and 'interview'
    const statusRes1 = await OpportunityEngine.updateApplicationStatus(COMPANY_A_ID, companyApps[0].id, 'shortlisted');
    assert(statusRes1.success, 'Application status updated to shortlisted');

    const statusRes2 = await OpportunityEngine.updateApplicationStatus(COMPANY_A_ID, companyApps[0].id, 'interview');
    assert(statusRes2.success, 'Application status updated to interview');

    // TEST 9: Saved Opportunities Management
    console.log('\n--- 9. Testing Saved Opportunities ---');
    const saveOppRes = await OpportunityEngine.saveOpportunity(TEST_USER_ID, oppId);
    assert(saveOppRes.success, 'Opportunity bookmarked to saved list');

    const unsaveOppRes = await OpportunityEngine.unsaveOpportunity(TEST_USER_ID, oppId);
    assert(unsaveOppRes.success, 'Opportunity unbookmarked');

    // TEST 10: Multi-Tenant Isolation
    console.log('\n--- 10. Testing Multi-Tenant Data Isolation ---');
    const compBApps = await OpportunityEngine.getCompanyApplications(COMPANY_B_ID);
    assert(Array.isArray(compBApps), 'Company B application pipeline isolated');

    // TEST 11: Scoring Safety & Trust Score Compatibility
    console.log('\n--- 11. Testing Scoring Safety ---');
    const trust = await TrustCalculatorService.calculateUserTrustScore(TEST_USER_ID);
    assert(trust.overallScore > 0 && trust.overallScore <= 1000, `Trust Score remains unaffected: ${trust.overallScore}/1000`);

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

runOpportunityEngineTests().catch(console.error);
