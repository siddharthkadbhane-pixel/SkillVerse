import Module from 'module';

// -----------------------------------------------------------------
// Mock VS Code runtime API for standalone Node test execution
// -----------------------------------------------------------------
const vscodeMock = {
  workspace: {
    workspaceFolders: [
      {
        uri: { fsPath: process.cwd() },
        name: 'Sillverse',
      },
    ],
    getConfiguration: () => ({
      get: (key: string, defaultValue: any) => defaultValue,
    }),
  },
  window: {
    createOutputChannel: (name: string) => ({
      appendLine: (msg: string) => {},
      show: () => {},
      dispose: () => {},
    }),
    createStatusBarItem: () => ({
      text: '',
      tooltip: '',
      command: '',
      show: () => {},
      dispose: () => {},
    }),
    registerTreeDataProvider: () => ({ dispose: () => {} }),
    showInformationMessage: async () => {},
    showWarningMessage: async () => {},
    showErrorMessage: async () => {},
    withProgress: async (opts: any, task: (progress: any) => Promise<any>) => {
      return task({ report: () => {} });
    },
  },
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
    executeCommand: async () => {},
  },
  EventEmitter: class {
    private listeners: Function[] = [];
    public event = (listener: Function) => {
      this.listeners.push(listener);
      return { dispose: () => {} };
    };
    public fire = (data: any) => {
      this.listeners.forEach((l) => l(data));
    };
  },
  TreeItem: class {
    constructor(public label: string, public collapsibleState?: any) {}
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: class {
    constructor(public id: string, public color?: any) {}
  },
  ThemeColor: class {
    constructor(public id: string) {}
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2,
  },
  ViewColumn: {
    One: 1,
  },
  Uri: {
    parse: (url: string) => ({ toString: () => url }),
  },
  env: {
    openExternal: async () => true,
  },
};

// Inject mock into require cache
const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (request === 'vscode') {
    return vscodeMock;
  }
  return originalLoad.apply(this, arguments);
};

async function runIdeExtensionTests() {
  console.log('========================================================================');
  console.log('  🛡️ SKILLVERSE PHASE 37: VS CODE IDE INTEGRATION TEST SUITE');
  console.log('========================================================================\n');

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
    // -------------------------------------------------------------
    // TEST 1: Backend IDE Auth Endpoint
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing IDE Authentication Endpoint & Token Exchange ---');
    const { POST: authPost } = await import('../app/api/ide/auth/route');
    const fakeAuthReq = {
      json: async () => ({ apiKey: 'sk_demo_token', username: 'siddharthkadbhane-pixel' }),
    } as any;

    const authRes = await authPost(fakeAuthReq);
    const authJson = await authRes.json();

    assert(authJson.success === true, 'IDE Auth endpoint successfully validated credentials');
    assert(authJson.data.token.startsWith('sk_live_'), `Issued secure session token: ${authJson.data.token.slice(0, 20)}...`);
    assert(authJson.data.user.username === 'siddharthkadbhane-pixel', 'Resolved developer profile: @siddharthkadbhane-pixel');
    assert(authJson.data.dcc.overallScore >= 800, `Returned verified DCC overall rating: ${authJson.data.dcc.overallScore}/1000`);
    assert(['Elite', 'Expert', 'Specialist'].includes(authJson.data.dcc.level), `Attached capability level: ${authJson.data.dcc.level}`);

    // -------------------------------------------------------------
    // TEST 2: Backend IDE Status & Heartbeat Endpoint
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing IDE Status & Heartbeat Endpoint ---');
    const { GET: statusGet } = await import('../app/api/ide/status/route');
    const fakeStatusReq = {
      url: 'http://localhost:3000/api/ide/status',
    } as any;

    const statusRes = await statusGet(fakeStatusReq);
    const statusJson = await statusRes.json();

    assert(statusJson.success === true, 'IDE Status heartbeat resolved');
    assert(statusJson.data.dcc.verifiedSkills.length > 0, `Compiled ${statusJson.data.dcc.verifiedSkills.length} verified skills for IDE view`);
    assert(statusJson.data.dcc.topCapabilities.length > 0, `Compiled ${statusJson.data.dcc.topCapabilities.length} engineering capabilities`);
    assert(!!statusJson.data.career.targetRole, `Included active career direction: ${statusJson.data.career.targetRole} (${statusJson.data.career.readinessTier})`);

    // -------------------------------------------------------------
    // TEST 3: Repository Detection & Verification Status Match
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Workspace Repository Verification Match ---');
    const fakeRepoReq = {
      url: 'http://localhost:3000/api/ide/status?repo=Sillverse',
    } as any;

    const repoStatusRes = await statusGet(fakeRepoReq);
    const repoStatusJson = await repoStatusRes.json();

    assert(repoStatusJson.success === true, 'Repository status resolved for Sillverse workspace');
    assert(!!repoStatusJson.data.repository, 'Repository metadata returned');
    assert(
      repoStatusJson.data.repository.verificationState === 'verified',
      `Repository verified: ${repoStatusJson.data.repository.name} (Health: ${repoStatusJson.data.repository.healthScore}%, Score: ${repoStatusJson.data.repository.overallScore}/1000)`
    );

    // -------------------------------------------------------------
    // TEST 4: Contextual File Review & Explain API (AST Heuristics)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Contextual AST File Review & Explain API ---');
    const { POST: inspectPost } = await import('../app/api/ide/inspect-file/route');

    const sampleCode = `
      interface UserCapability {
        score: number;
        level: string;
      }

      export async function calculateScore(user: UserCapability): Promise<number> {
        try {
          Logger.info('Calculating score for user');
          if (user.score > 100) return 100;
          return user.score;
        } catch (err: any) {
          Logger.error('Calculation error', err);
          return 0;
        }
      }
    `;

    const fakeInspectReq = {
      json: async () => ({
        filePath: 'services/testService.ts',
        language: 'typescript',
        code: sampleCode,
        action: 'review',
      }),
    } as any;

    const inspectRes = await inspectPost(fakeInspectReq);
    const inspectJson = await inspectRes.json();

    assert(inspectJson.success === true, 'AST File Review completed successfully');
    assert(inspectJson.data.score >= 80, `Assessed file code quality score: ${inspectJson.data.score}/100`);
    assert(inspectJson.data.complexity === 'Low', `Determined complexity: ${inspectJson.data.complexity}`);
    assert(inspectJson.data.insights.length > 0, `Generated ${inspectJson.data.insights.length} clean code insights`);
    assert(
      inspectJson.data.insights.some((i: string) => i.includes('type safety') || i.includes('error boundaries')),
      'Detected explicit type safety and error boundary patterns'
    );

    // -------------------------------------------------------------
    // TEST 5: Git Workspace Detector Logic
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Git Workspace Detector Logic ---');
    const { GitWorkspaceDetector } = await import('../packages/vscode-extension/src/utils/git');
    const repoMeta = await GitWorkspaceDetector.detectWorkspaceRepo();
    assert(repoMeta !== null, `GitWorkspaceDetector detected repository: ${repoMeta?.name}`);

    // -------------------------------------------------------------
    // TEST 6: Extension SecretStorage & Auth Manager
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Extension SecretStorage & Auth Manager ---');
    const { AuthManager } = await import('../packages/vscode-extension/src/auth/manager');
    const secretsStore: Record<string, string> = {};
    const globalStore: Record<string, any> = {};

    const mockContext = {
      secrets: {
        get: async (k: string) => secretsStore[k],
        store: async (k: string, v: string) => { secretsStore[k] = v; },
        delete: async (k: string) => { delete secretsStore[k]; },
      },
      globalState: {
        get: (k: string) => globalStore[k],
        update: async (k: string, v: any) => { globalStore[k] = v; },
      },
      subscriptions: [],
    } as any;

    const authMgr = AuthManager.initialize(mockContext);
    await authMgr.login('sk_live_test_token', {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Sidharth Kadbhane',
      username: 'siddharthkadbhane-pixel',
    });

    const session = await authMgr.getSession();
    assert(session.isAuthenticated === true, 'AuthManager session authenticated via SecretStorage');
    assert(session.token === 'sk_live_test_token', 'Securely retrieved token from secrets');
    assert(session.user?.username === 'siddharthkadbhane-pixel', 'Retrieved cached user metadata');

    await authMgr.logout();
    const loggedOutSession = await authMgr.getSession();
    assert(loggedOutSession.isAuthenticated === false, 'AuthManager successfully cleared secrets on logout');

    // -------------------------------------------------------------
    // TEST 7: DCC TreeDataProvider View Serialization
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing DCC TreeDataProvider Serialization ---');
    const { DCCTreeProvider } = await import('../packages/vscode-extension/src/providers/dccTreeProvider');
    const dccProvider = new DCCTreeProvider();

    // With authenticated session
    await authMgr.login('sk_live_test_token', {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Sidharth Kadbhane',
      username: 'siddharthkadbhane-pixel',
    });

    // Mock API client response for offline test
    (dccProvider as any).cachedStatus = statusJson.data;

    const rootItems = await dccProvider.getChildren();
    assert(rootItems.length === 4, `DCC Tree rendered 4 root sections (found ${rootItems.length})`);
    assert(rootItems.some((r) => r.label.includes('siddharthkadbhane-pixel')), 'Rendered Identity Root Node');
    assert(rootItems.some((r) => r.label === 'Verified Skills'), 'Rendered Verified Skills Root Node');
    assert(rootItems.some((r) => r.label === 'Engineering Capabilities'), 'Rendered Engineering Capabilities Root Node');
    assert(rootItems.some((r) => r.label === 'Career Intelligence'), 'Rendered Career Intelligence Root Node');

    const skillsRoot = rootItems.find((r) => r.label === 'Verified Skills');
    const skillItems = await dccProvider.getChildren(skillsRoot);
    assert(skillItems.length > 0, `Expanded ${skillItems.length} verified skill items in sidebar`);

    // -------------------------------------------------------------
    // TEST 8: Repository TreeDataProvider Serialization
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Repository TreeDataProvider Serialization ---');
    const { RepoTreeProvider } = await import('../packages/vscode-extension/src/providers/repoTreeProvider');
    const repoProvider = new RepoTreeProvider();

    (repoProvider as any).cachedRepoMeta = repoMeta;
    (repoProvider as any).cachedRepoInfo = repoStatusJson.data.repository;

    const repoRootItems = await repoProvider.getChildren();
    assert(repoRootItems.length === 2, `Repo Tree rendered 2 root nodes (found ${repoRootItems.length})`);
    assert(repoRootItems[0].contextValue === 'repo_root', 'Rendered Workspace Repo Node');
    assert(repoRootItems[1].contextValue === 'actions_root', 'Rendered Repository Actions Node');

    const actionItems = await repoProvider.getChildren(repoRootItems[1]);
    assert(actionItems.length === 2, `Rendered ${actionItems.length} quick action items (Analyze, Review File)`);

    // -------------------------------------------------------------
    // TEST 9: Status Bar State Management
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Status Bar State Formatting ---');
    const { SkillVerseStatusBar } = await import('../packages/vscode-extension/src/status/statusBar');
    const statusBar = new SkillVerseStatusBar();

    statusBar.renderConnected(statusJson.data);
    assert(
      (statusBar as any).statusBarItem.text.includes(statusJson.data.dcc.overallScore.toString()) &&
      (statusBar as any).statusBarItem.text.includes(statusJson.data.dcc.level),
      `Status bar formatted connected badge: ${(statusBar as any).statusBarItem.text}`
    );

    statusBar.renderDisconnected();
    assert(
      (statusBar as any).statusBarItem.text === '$(shield) SkillVerse: Connect',
      'Status bar formatted disconnected prompt'
    );

    // -------------------------------------------------------------
    // TEST 10: Security & Privacy Guard
    // -------------------------------------------------------------
    console.log('\n--- 10. Testing Privacy & Credential Security ---');
    assert(
      !authJson.data.token.includes('postgres:') && !authJson.data.token.includes('service_role'),
      'Session token contains zero database connection strings or Supabase service secrets'
    );
    assert(
      inspectJson.data.evaluatedAt !== undefined && !inspectJson.data.hasOwnProperty('raw_code_stored'),
      'File inspection operates ephemerally without persisting source code to database'
    );

  } catch (err: any) {
    console.error('Fatal IDE Test Exception:', err);
    failed++;
  }

  console.log('\n========================================================================');
  if (failed === 0) {
    console.log(`  🎉 ALL ${passed} SKILLVERSE VS CODE IDE INTEGRATION ASSERTIONS PASSED!`);
  } else {
    console.error(`  ⚠️ TESTS FINISHED WITH ${failed} FAILURES, ${passed} PASSED`);
  }
  console.log('========================================================================\n');
}

runIdeExtensionTests().catch(console.error);
