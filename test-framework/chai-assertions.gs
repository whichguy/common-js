function _main(
  module = globalThis.__getCurrentModule(),
  exports = module.exports,
  log = globalThis.__getModuleLogFunction?.(module) || (() => {})
) {
  /**
   * Deep equality comparison with circular reference detection
   * @param {*} a - First value
   * @param {*} b - Second value
   * @param {WeakMap} visitedA - Visited objects from a (for circular detection)
   * @param {WeakMap} visitedB - Visited objects from b (for circular detection)
   * @returns {boolean} True if deeply equal
   */
  function deepEqual(a, b, visitedA, visitedB) {
    // Initialize visited maps on first call
    if (!visitedA) {
      visitedA = new WeakMap();
      visitedB = new WeakMap();
    }
    
    // Handle primitives and same reference
    if (a === b) return true;
    
    // Handle null and undefined
    if (a == null || b == null) return a === b;
    
    // Handle different types
    if (typeof a !== typeof b) return false;
    
    // Handle Date objects
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    
    // Handle Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      // Check for circular references
      if (visitedA.has(a)) {
        return visitedB.has(b) && visitedA.get(a) === visitedB.get(b);
      }
      
      // Mark as visited
      const idA = visitedA.size;
      visitedA.set(a, idA);
      visitedB.set(b, idA);
      
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i], visitedA, visitedB)) return false;
      }
      return true;
    }
    
    // Handle Objects
    if (typeof a === 'object' && typeof b === 'object') {
      // Check for circular references
      if (visitedA.has(a)) {
        return visitedB.has(b) && visitedA.get(a) === visitedB.get(b);
      }
      
      // Mark as visited
      const idA = visitedA.size;
      visitedA.set(a, idA);
      visitedB.set(b, idA);
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual(a[key], b[key], visitedA, visitedB)) return false;
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Assertion class for chainable assertions
   */
  class Assertion {
    constructor(actual) {
      this.actual = actual;
      this.negated = false;
    }
    
    /**
     * Negate the assertion
     */
    get not() {
      this.negated = !this.negated;
      return this;
    }
    
    /**
     * Syntactic sugar for chaining
     */
    get to() {
      return this;
    }
    
    /**
     * Syntactic sugar for chaining
     */
    get be() {
      return this;
    }
    
    /**
     * Syntactic sugar for chaining
     */
    get been() {
      return this;
    }
    
    /**
     * Syntactic sugar for chaining
     */
    get have() {
      return this;
    }
    
    /**
     * Syntactic sugar for chaining
     */
    get deep() {
      this.useDeepEqual = true;
      return this;
    }
    
    /**
     * Assert equality
     * @param {*} expected - Expected value
     * @param {string} message - Optional message
     */
    equal(expected, message) {
      const isEqual = this.useDeepEqual 
        ? deepEqual(this.actual, expected)
        : this.actual === expected;
      
      const passes = this.negated ? !isEqual : isEqual;
      
      if (!passes) {
        const actualStr = JSON.stringify(this.actual);
        const expectedStr = JSON.stringify(expected);
        const notStr = this.negated ? 'not ' : '';
        const customMsg = message ? `: ${message}` : '';
        throw new Error(
          `Expected ${actualStr} to ${notStr}equal ${expectedStr}${customMsg}`
        );
      }
    }
    
    /**
     * Assert boolean true
     * @param {string} message - Optional message
     */
    get true() {
      const passes = this.negated ? this.actual !== true : this.actual === true;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        throw new Error(`Expected ${JSON.stringify(this.actual)} to ${notStr}be true`);
      }
    }
    
    /**
     * Assert boolean false
     * @param {string} message - Optional message
     */
    get false() {
      const passes = this.negated ? this.actual !== false : this.actual === false;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        throw new Error(`Expected ${JSON.stringify(this.actual)} to ${notStr}be false`);
      }
    }
    
    /**
     * Assert null
     * @param {string} message - Optional message
     */
    get null() {
      const passes = this.negated ? this.actual !== null : this.actual === null;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        throw new Error(`Expected ${JSON.stringify(this.actual)} to ${notStr}be null`);
      }
    }
    
    /**
     * Assert undefined
     * @param {string} message - Optional message
     */
    get undefined() {
      const passes = this.negated 
        ? this.actual !== undefined 
        : this.actual === undefined;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        throw new Error(`Expected ${JSON.stringify(this.actual)} to ${notStr}be undefined`);
      }
    }
    
    /**
     * Assert existence (not null and not undefined)
     * @param {string} message - Optional message
     */
    get exist() {
      const exists = this.actual !== null && this.actual !== undefined;
      const passes = this.negated ? !exists : exists;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        throw new Error(`Expected ${JSON.stringify(this.actual)} to ${notStr}exist`);
      }
    }
    
    /**
     * Assert empty (string, array, or object)
     * @param {string} message - Optional message
     */
    get empty() {
      let isEmpty;
      
      if (typeof this.actual === 'string' || Array.isArray(this.actual)) {
        isEmpty = this.actual.length === 0;
      } else if (typeof this.actual === 'object' && this.actual !== null) {
        isEmpty = Object.keys(this.actual).length === 0;
      } else {
        throw new Error('Expected string, array, or object');
      }
      
      const passes = this.negated ? !isEmpty : isEmpty;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        throw new Error(`Expected ${JSON.stringify(this.actual)} to ${notStr}be empty`);
      }
    }
    
    /**
     * Assert array/string length
     * @param {number} expected - Expected length
     * @param {string} message - Optional message
     */
    length(expected, message) {
      if (typeof this.actual !== 'string' && !Array.isArray(this.actual)) {
        throw new Error('Expected string or array');
      }
      
      const passes = this.negated 
        ? this.actual.length !== expected 
        : this.actual.length === expected;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        const customMsg = message ? `: ${message}` : '';
        throw new Error(
          `Expected ${JSON.stringify(this.actual)} to ${notStr}have length ${expected}${customMsg}`
        );
      }
    }
    
    /**
     * Assert array/string includes value
     * @param {*} value - Value to check for
     * @param {string} message - Optional message
     */
    include(value, message) {
      let includes;
      
      if (typeof this.actual === 'string') {
        includes = this.actual.includes(value);
      } else if (Array.isArray(this.actual)) {
        includes = this.actual.some(item => deepEqual(item, value));
      } else if (typeof this.actual === 'object' && this.actual !== null) {
        includes = Object.values(this.actual).some(v => deepEqual(v, value));
      } else {
        throw new Error('Expected string, array, or object');
      }
      
      const passes = this.negated ? !includes : includes;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        const customMsg = message ? `: ${message}` : '';
        throw new Error(
          `Expected ${JSON.stringify(this.actual)} to ${notStr}include ${JSON.stringify(value)}${customMsg}`
        );
      }
    }
    
    /**
     * Assert object has property
     * @param {string} property - Property name
     * @param {*} value - Optional expected value
     * @param {string} message - Optional message
     */
    property(property, value, message) {
      if (typeof this.actual !== 'object' || this.actual === null) {
        throw new Error('Expected object');
      }
      
      const hasProperty = property in this.actual;
      
      if (arguments.length === 1) {
        // Just check for property existence
        const passes = this.negated ? !hasProperty : hasProperty;
        
        if (!passes) {
          const notStr = this.negated ? 'not ' : '';
          throw new Error(`Expected object to ${notStr}have property '${property}'`);
        }
      } else {
        // Check property value
        if (!hasProperty) {
          throw new Error(`Expected object to have property '${property}'`);
        }
        
        const valueMatches = deepEqual(this.actual[property], value);
        const passes = this.negated ? !valueMatches : valueMatches;
        
        if (!passes) {
          const notStr = this.negated ? 'not ' : '';
          const customMsg = message ? `: ${message}` : '';
          throw new Error(
            `Expected property '${property}' to ${notStr}equal ${JSON.stringify(value)}${customMsg}`
          );
        }
      }
    }
    
    /**
     * Assert function throws error
     * @param {string|RegExp} errorMatch - Optional error message or pattern
     * @param {string} message - Optional message
     */
    throw(errorMatch, message) {
      if (typeof this.actual !== 'function') {
        throw new Error('Expected function');
      }
      
      let thrown = false;
      let error = null;
      
      try {
        this.actual();
      } catch (e) {
        thrown = true;
        error = e;
      }
      
      const passes = this.negated ? !thrown : thrown;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        const customMsg = message ? `: ${message}` : '';
        throw new Error(`Expected function to ${notStr}throw${customMsg}`);
      }
      
      // Check error message if provided
      if (thrown && errorMatch && !this.negated) {
        const errorMessage = error.message || String(error);
        let matches;
        
        if (errorMatch instanceof RegExp) {
          matches = errorMatch.test(errorMessage);
        } else {
          matches = errorMessage.includes(String(errorMatch));
        }
        
        if (!matches) {
          throw new Error(
            `Expected error message '${errorMessage}' to match ${errorMatch}`
          );
        }
      }
    }
    
    /**
     * Assert greater than
     * @param {number} expected - Expected minimum value (exclusive)
     * @param {string} message - Optional message
     */
    greaterThan(expected, message) {
      const passes = this.negated 
        ? !(this.actual > expected) 
        : this.actual > expected;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        const customMsg = message ? `: ${message}` : '';
        throw new Error(
          `Expected ${this.actual} to ${notStr}be greater than ${expected}${customMsg}`
        );
      }
    }
    
    /**
     * Assert less than
     * @param {number} expected - Expected maximum value (exclusive)
     * @param {string} message - Optional message
     */
    lessThan(expected, message) {
      const passes = this.negated 
        ? !(this.actual < expected) 
        : this.actual < expected;
      
      if (!passes) {
        const notStr = this.negated ? 'not ' : '';
        const customMsg = message ? `: ${message}` : '';
        throw new Error(
          `Expected ${this.actual} to ${notStr}be less than ${expected}${customMsg}`
        );
      }
    }
  }

  /**
   * Create an expectation assertion
   * @param {*} actual - Actual value
   * @returns {Assertion} Assertion object
   */
  function expect(actual) {
    return new Assertion(actual);
  }

  /**
   * Traditional assert-style assertions
   */
  const assert = {
    /**
     * Assert value is truthy
     * @param {*} value - Value to test
     * @param {string} message - Optional message
     */
    ok(value, message) {
      if (!value) {
        throw new Error(message || `Expected ${JSON.stringify(value)} to be truthy`);
      }
    },
    
    /**
     * Assert equality
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} message - Optional message
     */
    equal(actual, expected, message) {
      if (actual !== expected) {
        throw new Error(
          message || `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`
        );
      }
    },
    
    /**
     * Assert deep equality
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} message - Optional message
     */
    deepEqual(actual, expected, message) {
      if (!deepEqual(actual, expected)) {
        throw new Error(
          message || `Expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(expected)}`
        );
      }
    },
    
    /**
     * Assert strict equality
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} message - Optional message
     */
    strictEqual(actual, expected, message) {
      if (actual !== expected) {
        throw new Error(
          message || `Expected ${JSON.stringify(actual)} to strictly equal ${JSON.stringify(expected)}`
        );
      }
    },
    
    /**
     * Assert function throws
     * @param {Function} fn - Function to test
     * @param {string|RegExp} errorMatch - Optional error message or pattern
     * @param {string} message - Optional message
     */
    throws(fn, errorMatch, message) {
      let thrown = false;
      let error = null;
      
      try {
        fn();
      } catch (e) {
        thrown = true;
        error = e;
      }
      
      if (!thrown) {
        throw new Error(message || 'Expected function to throw');
      }
      
      if (errorMatch) {
        const errorMessage = error.message || String(error);
        let matches;
        
        if (errorMatch instanceof RegExp) {
          matches = errorMatch.test(errorMessage);
        } else {
          matches = errorMessage.includes(String(errorMatch));
        }
        
        if (!matches) {
          throw new Error(
            message || `Expected error message '${errorMessage}' to match ${errorMatch}`
          );
        }
      }
    },
    
    /**
     * Assert function does not throw
     * @param {Function} fn - Function to test
     * @param {string} message - Optional message
     */
    doesNotThrow(fn, message) {
      try {
        fn();
      } catch (e) {
        throw new Error(message || `Expected function not to throw but got: ${e.message}`);
      }
    }
  };

  // Export public API
  module.exports = {
    expect,
    assert,
    deepEqual
  };
}

__defineModule__(_main, false);