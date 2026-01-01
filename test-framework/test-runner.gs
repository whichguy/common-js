function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  const mocha = require('test-framework/mocha-adapter');
  const registry = require('test-framework/test-registry');

  /**
   * Run all tests
   * @returns {Object} Aggregated test results
   */
  function runAllTests() {
    console.log('🧪 Running all tests...\n');
    
    // Reset mocha context
    mocha.resetContext();
    
    // Discover and load all test modules
    const testModules = registry.discoverAll();
    
    // Load all tests
    for (const [repo, types] of Object.entries(testModules)) {
      for (const [type, modules] of Object.entries(types)) {
        for (const testModule of modules) {
          // Load test module - it registers itself with mocha via describe() and it() calls
          require(testModule);
        }
      }
    }
    
    // Execute all tests
    const startTime = Date.now();
    const results = mocha.executeAll();
    const duration = Date.now() - startTime;
    
    // Format and display results
    const formatted = mocha.formatResults(results);
    console.log(formatted);
    
    // Display summary
    const summary = mocha.getSummary(results);
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total:   ${summary.total}`);
    console.log(`Passed:  ${summary.passed} ✓`);
    console.log(`Failed:  ${summary.failed} ✗`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Pass Rate: ${summary.passRate}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');
    
    return {
      results,
      summary,
      duration
    };
  }

  /**
   * Run only unit tests
   * @returns {Object} Aggregated test results
   */
  function runUnitTests() {
    console.log('🧪 Running unit tests...\n');
    
    // Reset mocha context
    mocha.resetContext();
    
    // Discover and load only unit test modules
    const testModules = registry.discoverUnitTests();
    
    // Load all unit tests
    for (const [repo, modules] of Object.entries(testModules)) {
      for (const testModule of modules) {
        // Load test module - it registers itself with mocha when loaded
        require(testModule);
      }
    }
    
    // Execute all tests
    const startTime = Date.now();
    const results = mocha.executeAll();
    const duration = Date.now() - startTime;
    
    // Format and display results
    const formatted = mocha.formatResults(results);
    console.log(formatted);
    
    // Display summary
    const summary = mocha.getSummary(results);
    console.log('\n' + '='.repeat(60));
    console.log('📊 Unit Test Summary');
    console.log('='.repeat(60));
    console.log(`Total:   ${summary.total}`);
    console.log(`Passed:  ${summary.passed} ✓`);
    console.log(`Failed:  ${summary.failed} ✗`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Pass Rate: ${summary.passRate}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');
    
    return {
      results,
      summary,
      duration
    };
  }

  /**
   * Run only integration tests
   * @returns {Object} Aggregated test results
   */
  function runIntegrationTests() {
    console.log('🧪 Running integration tests...\n');
    
    // Reset mocha context
    mocha.resetContext();
    
    // Discover and load only integration test modules
    const testModules = registry.discoverIntegrationTests();
    
    // Load all integration tests
    for (const [repo, modules] of Object.entries(testModules)) {
      for (const testModule of modules) {
        // Load test module - it registers itself with mocha when loaded
        require(testModule);
      }
    }
    
    // Execute all tests
    const startTime = Date.now();
    const results = mocha.executeAll();
    const duration = Date.now() - startTime;
    
    // Format and display results
    const formatted = mocha.formatResults(results);
    console.log(formatted);
    
    // Display summary
    const summary = mocha.getSummary(results);
    console.log('\n' + '='.repeat(60));
    console.log('📊 Integration Test Summary');
    console.log('='.repeat(60));
    console.log(`Total:   ${summary.total}`);
    console.log(`Passed:  ${summary.passed} ✓`);
    console.log(`Failed:  ${summary.failed} ✗`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Pass Rate: ${summary.passRate}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');
    
    return {
      results,
      summary,
      duration
    };
  }

  /**
   * Run tests for a specific repo
   * @param {string} repoName - Repository name (e.g., 'common-js', 'sheets-chat')
   * @returns {Object} Aggregated test results
   */
  function runRepoTests(repoName) {
    console.log(`🧪 Running tests for ${repoName}...\n`);
    
    // Reset mocha context
    mocha.resetContext();
    
    // Discover and load tests for specific repo
    const testModules = registry.discoverRepoTests(repoName);
    
    if (!testModules) {
      console.log(`❌ No tests found for repo: ${repoName}\n`);
      return {
        results: [],
        summary: { total: 0, passed: 0, failed: 0, skipped: 0, passRate: 'N/A' },
        duration: 0
      };
    }
    
    // Load all tests for this repo
    for (const [type, modules] of Object.entries(testModules)) {
      for (const testModule of modules) {
        // Load test module - it registers itself with mocha when loaded
        require(testModule);
      }
    }
    
    // Execute all tests
    const startTime = Date.now();
    const results = mocha.executeAll();
    const duration = Date.now() - startTime;
    
    // Format and display results
    const formatted = mocha.formatResults(results);
    console.log(formatted);
    
    // Display summary
    const summary = mocha.getSummary(results);
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${repoName} Test Summary`);
    console.log('='.repeat(60));
    console.log(`Total:   ${summary.total}`);
    console.log(`Passed:  ${summary.passed} ✓`);
    console.log(`Failed:  ${summary.failed} ✗`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Pass Rate: ${summary.passRate}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');
    
    return {
      results,
      summary,
      duration
    };
  }

  /**
   * Run tests for a specific repo and type
   * @param {string} repoName - Repository name
   * @param {string} type - Test type ('unit' or 'integration')
   * @returns {Object} Aggregated test results
   */
  function runRepoTypeTests(repoName, type) {
    console.log(`🧪 Running ${type} tests for ${repoName}...\n`);
    
    // Reset mocha context
    mocha.resetContext();
    
    // Discover and load tests for specific repo and type
    const testModules = registry.discoverRepoTypeTests(repoName, type);
    
    if (!testModules || testModules.length === 0) {
      console.log(`❌ No ${type} tests found for repo: ${repoName}\n`);
      return {
        results: [],
        summary: { total: 0, passed: 0, failed: 0, skipped: 0, passRate: 'N/A' },
        duration: 0
      };
    }
    
    // Load all tests
    for (const testModule of testModules) {
      // Load test module - it registers itself with mocha when loaded
      require(testModule);
    }
    
    // Execute all tests
    const startTime = Date.now();
    const results = mocha.executeAll();
    const duration = Date.now() - startTime;
    
    // Format and display results
    const formatted = mocha.formatResults(results);
    console.log(formatted);
    
    // Display summary
    const summary = mocha.getSummary(results);
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${repoName} ${type} Test Summary`);
    console.log('='.repeat(60));
    console.log(`Total:   ${summary.total}`);
    console.log(`Passed:  ${summary.passed} ✓`);
    console.log(`Failed:  ${summary.failed} ✗`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Pass Rate: ${summary.passRate}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');
    
    return {
      results,
      summary,
      duration
    };
  }

  /**
   * Run a specific test file
   * @param {string} testPath - Full path to test file (e.g., 'common-js/test/UrlFetchUtils.unit.test')
   * @returns {Object} Aggregated test results
   */
  function runTestFile(testPath) {
    console.log(`🧪 Running test file: ${testPath}...\n`);
    
    // Reset mocha context
    mocha.resetContext();
    
    // Load the specific test file
    try {
      require(testPath);
    } catch (error) {
      console.log(`❌ Error loading test file: ${error.message}\n`);
      return {
        results: [],
        summary: { total: 0, passed: 0, failed: 0, skipped: 0, passRate: 'N/A' },
        duration: 0,
        error: error.message
      };
    }
    
    // Execute all tests
    const startTime = Date.now();
    const results = mocha.executeAll();
    const duration = Date.now() - startTime;
    
    // Format and display results
    const formatted = mocha.formatResults(results);
    console.log(formatted);
    
    // Display summary
    const summary = mocha.getSummary(results);
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test File Summary: ${testPath}`);
    console.log('='.repeat(60));
    console.log(`Total:   ${summary.total}`);
    console.log(`Passed:  ${summary.passed} ✓`);
    console.log(`Failed:  ${summary.failed} ✗`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Pass Rate: ${summary.passRate}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');
    
    return {
      results,
      summary,
      duration
    };
  }

  // Export public API
  module.exports = {
    runAllTests,
    runUnitTests,
    runIntegrationTests,
    runRepoTests,
    runRepoTypeTests,
    runTestFile
  };
}

__defineModule__(_main);