function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  require = globalThis.require
) {
  /**
   * Module: tools/TestModule
   * Auto-wrapped for GAS CommonJS compatibility
   */
  
  // Test module to verify BUG #2 fix
  class TestModule {
    constructor() {
      this.name = "TestModule";
    }
    
    test() {
      return "Module name should be: tools/TestModule";
    }
  }
  
  module.exports = TestModule;
  
}

__defineModule__(_main);