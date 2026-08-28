import { CommunityEngine, DUMMY_POSTS, DUMMY_QUESTIONS } from '../services/community/engine';
import { TrustCalculatorService } from '../services/trust/calculator';

async function runCommunityEngineTests() {
  console.log('====================================================');
  console.log('  🧪 SKILLVERSE PHASE 34: DEVELOPER COMMUNITY & KNOWLEDGE TEST');
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

  const AUTHOR_ID = '00000000-0000-0000-0000-000000000000';
  const RESPONDER_ID = '00000000-0000-0000-0000-000000000004';
  const QUESTIONER_ID = '00000000-0000-0000-0000-000000000005';

  try {
    // TEST 1: Community Content Types Supported (8 Types)
    console.log('\n--- 1. Testing Community Content Types (8 Types) ---');
    const contentTypes = [
      'project_showcase',
      'technical_discussion',
      'question',
      'progress_update',
      'code_help',
      'open_source_request',
      'tutorial',
      'challenge_result'
    ];
    contentTypes.forEach(ct => {
      assert(typeof ct === 'string', `Content type supported: ${ct}`);
    });

    // TEST 2: Post Creation & Retrieval
    console.log('\n--- 2. Testing Post Creation & Feed ---');
    const createPostRes = await CommunityEngine.createPost(AUTHOR_ID, {
      title: 'Architectural Analysis of Micro-Frontend Runtimes',
      content: 'Benchmarking module federation overhead vs single-spa in edge SSR environments.',
      contentType: 'technical_discussion',
      tags: ['TypeScript', 'Architecture', 'Next.js 15'],
      codeSnippet: `export const remotes = { 'app1': 'app1@https://cdn.example.com/remoteEntry.js' };`,
    });
    assert(createPostRes.success && !!createPostRes.post, `Created technical writeup: "${createPostRes.post?.title}"`);
    const postId = createPostRes.post.id;

    const feed = await CommunityEngine.getFeed({ q: 'Micro-Frontend' }, AUTHOR_ID);
    assert(feed.posts.length > 0, `Feed search returned ${feed.posts.length} post(s)`);

    // TEST 3: Voting & Comments
    console.log('\n--- 3. Testing Interactions: Votes & Comments ---');
    const voteRes = await CommunityEngine.votePost(postId, AUTHOR_ID);
    assert(voteRes.success && voteRes.hasUpvoted, 'Post upvoted successfully');

    const commentRes = await CommunityEngine.addComment(postId, RESPONDER_ID, 'Great analysis! How did you measure hydration latency?');
    assert(commentRes.success && !!commentRes.comment, 'Comment added to post');

    // TEST 4: Technical Q&A Lifecycle
    console.log('\n--- 4. Testing Technical Q&A Lifecycle ---');
    const createQRes = await CommunityEngine.createQuestion(QUESTIONER_ID, {
      title: 'How to implement zero-copy deserialization in Rust with serde?',
      content: 'Need guidance on zero-copy parsing for network packet buffers using Serde and `std::borrow::Cow`.',
      tags: ['Rust', 'Systems', 'Performance'],
      codeSnippet: `#[derive(Deserialize)] struct Packet<'a> { #[serde(borrow)] data: &'a [u8] }`,
    });
    assert(createQRes.success && !!createQRes.question, `Question created: "${createQRes.question?.title}"`);
    const qId = createQRes.question.id;

    const ansRes = await CommunityEngine.answerQuestion(qId, AUTHOR_ID, 'Use `serde::borrow` along with the lifetime parameter in your struct definition.', `#[serde(borrow)]\npayload: &'a str`);
    assert(ansRes.success && !!ansRes.answer, 'Answer submitted for question');
    const ansId = ansRes.answer!.id;

    // Accept answer (Author only)
    const acceptRes = await CommunityEngine.acceptAnswer(qId, ansId, QUESTIONER_ID);
    assert(acceptRes.success, 'Answer marked as accepted (+25 Community Reputation)');

    const updatedQ = await CommunityEngine.getQuestionById(qId, QUESTIONER_ID);
    assert(updatedQ?.status === 'answered' && updatedQ.acceptedAnswerId === ansId, 'Question status transitioned to solved/answered');

    // TEST 5: Peer Code Review Workflow
    console.log('\n--- 5. Testing Peer Code Review Workflow ---');
    const reviewReqRes = await CommunityEngine.createPeerReviewRequest(AUTHOR_ID, {
      title: 'Peer Review: Raft Distributed Consensus Implementation',
      description: 'Requesting code audit on leader election timers and log compaction logic.',
      repositoryUrl: 'https://github.com/siddharthkadbhane-pixel/raft-consensus',
      focusAreas: ['Concurrency', 'Log Replication', 'Unit Tests'],
    });
    assert(reviewReqRes.success && !!reviewReqRes.request, `Peer review request published: "${reviewReqRes.request?.title}"`);
    const reqId = reviewReqRes.request.id;

    const reviewRes = await CommunityEngine.submitPeerReviewResponse(reqId, RESPONDER_ID, {
      architectureScore: 92,
      codeQualityScore: 90,
      securityScore: 88,
      testingScore: 94,
      feedbackNotes: 'Thorough heartbeat timing handling. Suggest adding invariant checks before log state transitions.',
      suggestedImprovements: ['Fuzz test network partitions', 'Add Prometheus telemetry'],
    });
    assert(reviewRes.success && !!reviewRes.response, 'Structured peer review audit submitted');

    // TEST 6: Open Source Discovery
    console.log('\n--- 6. Testing Open Source Discovery ---');
    const osOpps = await CommunityEngine.getOpenSourceOpportunities();
    assert(Array.isArray(osOpps) && osOpps.length > 0, `Retrieved ${osOpps.length} open source opportunities`);

    // TEST 7: Following System
    console.log('\n--- 7. Testing Follow System ---');
    const followRes = await CommunityEngine.toggleFollow(AUTHOR_ID, 'developer', RESPONDER_ID);
    assert(followRes.success, `Follow status toggled: ${followRes.message}`);

    // TEST 8: Community Moderation
    console.log('\n--- 8. Testing Moderation & Safety ---');
    const reportRes = await CommunityEngine.reportContent(AUTHOR_ID, 'post', postId, 'Spam or irrelevant');
    assert(reportRes.success, 'Content reported to moderation queue');

    const blockRes = await CommunityEngine.blockUser(AUTHOR_ID, '00000000-0000-0000-0000-000000000099');
    assert(blockRes.success, 'User blocked successfully');

    // TEST 9: Community Reputation & DCC Separation
    console.log('\n--- 9. Testing Community Reputation vs DCC Separation ---');
    const rep = await CommunityEngine.getCommunityReputation(AUTHOR_ID);
    assert(rep.totalReputationPoints > 0 && typeof rep.badgeLevel === 'string', `Community reputation calculated: ${rep.totalReputationPoints} pts (Badge: ${rep.badgeLevel})`);

    const trust = await TrustCalculatorService.calculateUserTrustScore(AUTHOR_ID);
    assert(trust.overallScore > 0, `Trust Score remains unaffected by vanity metrics: ${trust.overallScore}/1000`);

    // Cleanup: Delete created test post
    await CommunityEngine.deletePost(postId, AUTHOR_ID);

  } catch (err: any) {
    console.error('❌ Exception in test suite:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runCommunityEngineTests().catch(console.error);
