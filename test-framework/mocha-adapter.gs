function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  // Global context to track test suite hierarchy
  const context = {
    currentSuite: null,
    rootSuites: [],
    testResults: []
  };

  /**
   * Define a test suite
   * @param {string} name - Suite name
   * @param {Function} fn - Suite definition function
   */
  function describe(name, fn) {
    const suite = {
      name: name,
      parent: context.currentSuite,
      tests: [],
      suites: [],
      hooks: {
        beforeEach: [],
        afterEach: []
      }
    };
    
    // Add to parent or root
    if (context.currentSuite) {
      context.currentSuite.suites.push(suite);
    } else {
      context.rootSuites.push(suite);
    }
    
    // Execute suite definition in context of this suite
    const previousSuite = context.currentSuite;
    context.currentSuite = suite;
    
    try {
      fn();
    } finally {
      // Restore parent suite context
      context.currentSuite = previousSuite;
    }
  }

  /**
   * Define a test case
   * @param {string} name - Test name
   * @param {Function} fn - Test function
   */
  function it(name, fn) {
    if (!context.currentSuite) {
      throw new Error('it() must be called inside a describe() block');
    }
    
    context.currentSuite.tests.push({
      name: name,
      fn: fn
    });
  }

  /**
   * Define a beforeEach hook
   * @param {Function} fn - Hook function
   */
  function beforeEach(fn) {
    if (!context.currentSuite) {
      throw new Error('beforeEach() must be called inside a describe() block');
    }
    
    context.currentSuite.hooks.beforeEach.push(fn);
  }

  /**
   * Define an afterEach hook
   * @param {Function} fn - Hook function
   */
  function afterEach(fn) {
    if (!context.currentSuite) {
      throw new Error('afterEach() must be called inside a describe() block');
    }
    
    context.currentSuite.hooks.afterEach.push(fn);
  }

  /**
   * Get the current test context
   * @returns {Object} Test context with root suites and results
   */
  function getContext() {
    return {
      rootSuites: context.rootSuites,
      testResults: context.testResults,
      currentSuite: context.currentSuite
    };
  }

  /**
   * Reset the test context (useful between test runs)
   */
  function resetContext() {
    context.currentSuite = null;
    context.rootSuites = [];
    context.testResults = [];
  }

  /**
   * Execute a test suite and all nested suites
   * @param {Object} suite - Suite to execute
   * @param {Array} ancestorHooks - Hooks from ancestor suites
   * @returns {Object} Suite results
   */
  function executeSuite(suite, ancestorHooks = { beforeEach: [], afterEach: [] }) {
    const suiteResult = {
      name: suite.name,
      tests: [],
      suites: [],
      passed: 0,
      failed: 0,
      skipped: 0
    };
    
    // Collect all beforeEach/afterEach hooks from ancestors and current suite
    const allBeforeEach = [...ancestorHooks.beforeEach, ...suite.hooks.beforeEach];
    const allAfterEach = [...ancestorHooks.afterEach, ...suite.hooks.afterEach];
    
    // Execute tests
    for (const test of suite.tests) {
      const testResult = executeTest(test, allBeforeEach, allAfterEach);
      suiteResult.tests.push(testResult);
      
      if (testResult.passed) {
        suiteResult.passed++;
      } else if (testResult.skipped) {
        suiteResult.skipped++;
      } else {
        suiteResult.failed++;
      }
    }
    
    // Execute nested suites
    for (const nestedSuite of suite.suites) {
      const nestedResult = executeSuite(nestedSuite, {
        beforeEach: allBeforeEach,
        afterEach: allAfterEach
      });
      suiteResult.suites.push(nestedResult);
      suiteResult.passed += nestedResult.passed;
      suiteResult.failed += nestedResult.failed;
      suiteResult.skipped += nestedResult.skipped;
    }
    
    return suiteResult;
  }

  /**
   * Execute a single test with hooks
   * @param {Object} test - Test to execute
   * @param {Array} beforeEachHooks - BeforeEach hooks to run
   * @param {Array} afterEachHooks - AfterEach hooks to run
   * @returns {Object} Test result
   */
  function executeTest(test, beforeEachHooks, afterEachHooks) {
    const testResult = {
      name: test.name,
      passed: false,
      skipped: false,
      error: null,
      duration: 0
    };
    
    const startTime = Date.now();
    let testPassed = false;
    let testError = null;
    
    try {
      // Run beforeEach hooks
      for (const hook of beforeEachHooks) {
        hook();
      }
      
      // Run test
      test.fn();
      testPassed = true;
      
    } catch (error) {
      testPassed = false;
      testError = error;
    }
    
    // Run afterEach hooks (even if test failed)
    // But preserve the original test error
    try {
      for (const hook of afterEachHooks) {
        hook();
      }
    } catch (hookError) {
      // If test passed but afterEach failed, that's a failure
      if (testPassed) {
        testPassed = false;
        testError = new Error(`afterEach hook failed: ${hookError.message}`);
        testError.stack = hookError.stack;
      }
      // If test already failed, log hook error but keep original test error
      else {
        Logger.log(`Warning: afterEach hook failed after test failure: ${hookError.message}`);
      }
    }
    
    testResult.passed = testPassed;
    if (testError) {
      testResult.error = {
        message: testError.message,
        stack: testError.stack
      };
    }
    testResult.duration = Date.now() - startTime;
    
    return testResult;
  }

  /**
   * Execute all root suites
   * @returns {Array} Results for all root suites
   */
  function executeAll() {
    const results = [];
    
    for (const suite of context.rootSuites) {
      results.push(executeSuite(suite));
    }
    
    context.testResults = results;
    return results;
  }

  /**
   * Format test results as a readable string
   * @param {Array} results - Test results
   * @param {number} indent - Indentation level
   * @returns {string} Formatted results
   */
  function formatResults(results, indent = 0) {
    const indentStr = '  '.repeat(indent);
    let output = '';
    
    for (const suiteResult of results) {
      output += `${indentStr}${suiteResult.name}\n`;
      
      // Format tests
      for (const test of suiteResult.tests) {
        const status = test.passed ? '✓' : '✗';
        const duration = `(${test.duration}ms)`;
        output += `${indentStr}  ${status} ${test.name} ${duration}\n`;
        
        if (!test.passed && test.error) {
          output += `${indentStr}    Error: ${test.error.message}\n`;
          if (test.error.stack) {
            const stackLines = test.error.stack.split('\n').slice(0, 3);
            output += stackLines.map(line => `${indentStr}      ${line}`).join('\n') + '\n';
          }
        }
      }
      
      // Format nested suites
      if (suiteResult.suites.length > 0) {
        output += formatResults(suiteResult.suites, indent + 1);
      }
    }
    
    return output;
  }

  /**
   * Get summary statistics from results
   * @param {Array} results - Test results
   * @returns {Object} Summary statistics
   */
  function getSummary(results) {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const result of results) {
      total += result.passed + result.failed + result.skipped;
      passed += result.passed;
      failed += result.failed;
      skipped += result.skipped;
    }
    
    return {
      total: total,
      passed: passed,
      failed: failed,
      skipped: skipped,
      passRate: total > 0 ? (passed / total * 100).toFixed(1) + '%' : 'N/A'
    };
  }

  // Export public API
  module.exports = {
    describe,
    it,
    beforeEach,
    afterEach,
    getContext,
    resetContext,
    executeAll,
    formatResults,
    getSummary
  };
}

__defineModule__(_main);