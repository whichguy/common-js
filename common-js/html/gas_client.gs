<script>
/**
 * @fileoverview Promise-based wrapper for google.script.run API
 * 
 * Provides a modern Promise-based interface for calling Google Apps Script server functions
 * from client-side code, replacing the callback-based google.script.run API.
 * 
 * @example
 * // Basic usage with auto-throw on error
 * const server = createGasServer();
 * server.getData().then(result => console.log(result));
 * 
 * @example
 * // With explicit error handling
 * server.getData()
 *   .then(result => process(result))
 *   .catch(error => handleError(error))
 *   .finally(() => setLoading(false));
 * 
 * @example
 * // With configuration
 * const server = createGasServer({
 *   debug: true,
 *   throwOnUnhandled: true,
 *   checkNetwork: true,
 *   onError: (err, funcName, args) => console.error(`[${funcName}]`, err)
 * });
 */

/**
 * Factory function to create a Promise-based wrapper for google.script.run
 * 
 * @param {Object} config - Configuration options
 * @param {boolean} [config.debug=false] - Enable debug logging
 * @param {boolean} [config.throwOnUnhandled=true] - Auto-throw on unhandled rejections
 * @param {Function} [config.onError=null] - Global error handler (error, funcName, args) => void
 * @param {Function} [config.onSuccess=null] - Global success handler (result, funcName, args) => void
 * @param {Object} [config.logger=console] - Logger instance
 * @param {boolean} [config.checkNetwork=true] - Enable network connectivity checking
 * @param {number} [config.networkTimeout=30000] - Network check timeout in ms
 * @param {boolean} [config.validateArgs=true] - Validate argument serializability
 * @param {boolean} [config.warnOnLargePayload=true] - Warn on payloads >50MB
 * @param {number} [config.memoryLeakWarningMs=30000] - Warn if call not executed within timeout
 * @param {Object} [config.mock=null] - Mock object for testing (bypasses google.script.run)
 * @returns {Proxy} Proxy object wrapping google.script.run with Promise API
 */
function createGasServer(config = {}) {
  // Configuration with defaults
  const {
    debug = false,
    throwOnUnhandled = true,
    onError = null,
    onSuccess = null,
    logger = console,
    checkNetwork = true,
    networkTimeout = 30000,
    validateArgs = true,
    warnOnLargePayload = true,
    memoryLeakWarningMs = 30000,
    mock = null
  } = config;

  // Validation
  if (onError && typeof onError !== 'function') {
    throw new TypeError('onError must be a function');
  }
  if (onSuccess && typeof onSuccess !== 'function') {
    throw new TypeError('onSuccess must be a function');
  }
  if (typeof logger !== 'object' || !logger.log) {
    throw new TypeError('logger must have a .log() method');
  }

  // Use mock in testing or google.script.run in production
  const target = mock || (typeof google !== 'undefined' && google.script ? google.script.run : null);
  
  if (!target && !mock) {
    throw new Error('google.script.run is not available and no mock provided');
  }

  /**
   * Validates that arguments can be serialized for transport to server
   * @private
   */
  function validateSerializability(args, funcName) {
    if (!validateArgs) return;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      // Check for non-serializable types
      if (typeof arg === 'function') {
        throw new TypeError(
          `Argument ${i} to ${funcName}() is a function and cannot be sent to server. ` +
          `Functions cannot be serialized.`
        );
      }
      
      if (typeof arg === 'object' && arg !== null) {
        // Check for DOM elements
        if (arg instanceof Element || arg instanceof Node) {
          throw new TypeError(
            `Argument ${i} to ${funcName}() is a DOM element and cannot be sent to server. ` +
            `Extract the data you need (e.g., element.value, element.textContent) before sending.`
          );
        }
        
        // Check for circular references
        try {
          JSON.stringify(arg);
        } catch (e) {
          if (e.message.includes('circular')) {
            throw new TypeError(
              `Argument ${i} to ${funcName}() contains circular references and cannot be serialized. ` +
              `Remove circular references before sending to server.`
            );
          }
          throw e;
        }
      }
    }
  }

  /**
   * Estimates payload size and warns if large
   * @private
   */
  function checkPayloadSize(args, funcName) {
    if (!warnOnLargePayload) return;

    try {
      const json = JSON.stringify(args);
      const sizeBytes = new Blob([json]).size;
      const sizeMB = sizeBytes / (1024 * 1024);
      
      if (sizeMB > 50) {
        logger.warn(
          `[GasServer] Large payload detected for ${funcName}(): ${sizeMB.toFixed(2)}MB. ` +
          `Google Apps Script has a 50MB limit. Consider chunking your data.`
        );
      }
    } catch (e) {
      // Ignore size check errors
    }
  }

  /**
   * Enhanced error with contextual information
   * @private
   */
  function enhanceError(error, funcName, args) {
    const enhanced = new Error(error.message || String(error));
    enhanced.originalError = error;
    enhanced.functionName = funcName;
    enhanced.arguments = args;
    enhanced.timestamp = new Date().toISOString();
    
    // Add helpful hints based on error message
    if (error.message && error.message.includes('not found')) {
      enhanced.hint = `Function "${funcName}" not found on server. Check spelling and ensure function is deployed.`;
    } else if (error.message && error.message.includes('permission')) {
      enhanced.hint = `Permission denied. User may need to authorize the script or function may not be publicly accessible.`;
    } else if (error.message && error.message.includes('timeout')) {
      enhanced.hint = `Server function timed out. Consider optimizing the function or increasing timeout limit.`;
    }
    
    return enhanced;
  }

  return new Proxy(target, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop.startsWith('_')) {
        return target[prop];
      }

      // Helper method to list available functions (for debugging deployment issues)
      if (prop === '__listAvailableFunctions__') {
        return () => {
          return Object.keys(target)
            .filter(k => typeof target[k] === 'function')
            .sort();
        };
      }

      // Handle nested properties (e.g., ScriptApp, PropertiesService)
      // Return a nested proxy if target[prop] exists and is an object
      if (target[prop] && typeof target[prop] === 'object') {
        return new Proxy(target[prop], this);
      }

      return function(...args) {
        // Generate unique request ID for debugging
        const requestId = `${prop}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        let userObject;
        let isExecuted = false;
        let executionPromise = null;
        let networkCheckInterval = null;
        let memoryLeakTimer = null;

        if (debug) {
          logger.log(`[GasServer][${requestId}] Creating call to ${prop}() with ${args.length} arguments`);
        }

        // Memory leak detection - warn if call never executed
        if (memoryLeakWarningMs > 0) {
          memoryLeakTimer = setTimeout(() => {
            if (!isExecuted) {
              logger.warn(
                `[GasServer][${requestId}] Potential memory leak: ${prop}() was created but never executed ` +
                `(no .then(), .catch(), or .finally() called within ${memoryLeakWarningMs}ms). ` +
                `Did you forget to await or chain the promise?`
              );
            }
          }, memoryLeakWarningMs);
        }

        /**
         * Cleanup function for intervals and timers
         * @private
         */
        const cleanup = () => {
          if (networkCheckInterval) {
            clearInterval(networkCheckInterval);
            networkCheckInterval = null;
          }
          if (memoryLeakTimer) {
            clearTimeout(memoryLeakTimer);
            memoryLeakTimer = null;
          }
        };

        const api = {
          /**
           * Attach user object to pass context to server handlers
           * @param {*} obj - User object to attach
           * @returns {Object} API object for chaining
           */
          withUserObject(obj) {
            if (isExecuted) {
              throw new Error(`Cannot call withUserObject() after ${prop}() has been executed`);
            }
            userObject = obj;
            return this;
          },

          /**
           * Promise .then() handler - triggers execution on first call
           * @param {Function} onResolve - Success handler
           * @param {Function} onReject - Error handler
           * @returns {Promise} Promise for chaining
           */
          then(onResolve, onReject) {
            // FIX #1: Return cached promise if already executed
            if (executionPromise) {
              if (debug) {
                logger.log(`[GasServer][${requestId}] Reusing cached promise for ${prop}()`);
              }
              return executionPromise.then(onResolve, onReject);
            }

            // FIX #4: Auto-throw on unhandled rejections
            const hasErrorHandler = !!onReject;
            let finalOnReject = onReject;
            
            if (!hasErrorHandler && throwOnUnhandled !== false) {
              if (debug) {
                logger.log(`[GasServer][${requestId}] No error handler provided, will auto-throw on rejection`);
              }
              finalOnReject = (error) => {
                throw error;
              };
            }

            isExecuted = true;

            if (debug) {
              logger.log(`[GasServer][${requestId}] Executing ${prop}() with args:`, args);
            }

            try {
              // Validate arguments
              validateSerializability(args, prop);
              checkPayloadSize(args, prop);

              // Network connectivity check
              if (checkNetwork && !navigator.onLine) {
                const error = new Error('No internet connection');
                error.hint = 'Check your network connection and try again';
                cleanup();
                return Promise.reject(error).then(onResolve, finalOnReject);
              }

              const startTime = Date.now();

              // Create execution promise
              executionPromise = new Promise((resolve, reject) => {
                // Monitor network during execution
                if (checkNetwork) {
                  networkCheckInterval = setInterval(() => {
                    if (!navigator.onLine) {
                      cleanup();
                      const error = new Error('Network connection lost during execution');
                      error.hint = 'Network connection was lost while waiting for server response';
                      reject(error);
                    }
                  }, 1000);

                  // Timeout network check
                  setTimeout(() => {
                    cleanup();
                  }, networkTimeout);
                }

                const successHandler = (result) => {
                  cleanup();
                  const duration = Date.now() - startTime;

                  if (debug) {
                    logger.log(`[GasServer][${requestId}] ${prop}() succeeded in ${duration}ms:`, result);
                  }

                  // Global success handler
                  if (onSuccess) {
                    try {
                      onSuccess(result, prop, args, duration);
                    } catch (e) {
                      logger.error(`[GasServer][${requestId}] Error in global onSuccess handler:`, e);
                    }
                  }

                  resolve(result);
                };

                const failureHandler = (error) => {
                  cleanup();
                  const duration = Date.now() - startTime;
                  const enhanced = enhanceError(error, prop, args);

                  if (debug) {
                    logger.error(`[GasServer][${requestId}] ${prop}() failed after ${duration}ms:`, enhanced);
                  }

                  // Global error handler
                  if (onError) {
                    try {
                      onError(enhanced, prop, args, duration);
                    } catch (e) {
                      logger.error(`[GasServer][${requestId}] Error in global onError handler:`, e);
                    }
                  }

                  reject(enhanced);
                };

                // FIX #3: Chain correctly - withUserObject returns the runner for chaining
                let runner = target
                  .withSuccessHandler(successHandler)
                  .withFailureHandler(failureHandler);

                if (userObject !== undefined) {
                  runner = runner.withUserObject(userObject);
                }

                // Enhanced debug logging
                if (debug) {
                  const availableFuncs = Object.keys(runner).filter(k => typeof runner[k] === 'function');
                  logger.log(`[GasServer][${requestId}] Available functions on runner:`, availableFuncs);
                  logger.log(`[GasServer][${requestId}] Attempting to call: ${prop}`);
                }

                // Defensive validation - check if function exists before calling
                if (typeof runner[prop] !== 'function') {
                  const availableFunctions = Object.keys(runner)
                    .filter(k => typeof runner[k] === 'function')
                    .join(', ');
                  
                  const error = new Error(
                    `Function "${prop}" is not available on google.script.run. ` +
                    `This usually means:\n` +
                    `  1. The function is not deployed to the web app\n` +
                    `  2. The function name is misspelled\n` +
                    `  3. You're hitting the wrong deployment (dev/staging/prod)\n` +
                    `Available functions: ${availableFunctions || 'none'}`
                  );
                  error.code = 'FUNCTION_NOT_FOUND';
                  error.functionName = prop;
                  error.availableFunctions = availableFunctions.split(', ');
                  
                  reject(error);
                  return;
                }

                runner[prop](...args);
              });

              return executionPromise.then(onResolve, finalOnReject);

            } catch (error) {
              // FIX #2: Ensure cleanup on validation errors
              cleanup();
              const enhanced = enhanceError(error, prop, args);
              
              if (debug) {
                logger.error(`[GasServer][${requestId}] Validation error in ${prop}():`, enhanced);
              }
              
              // Store the rejected promise
              executionPromise = Promise.reject(enhanced);
              return executionPromise.then(onResolve, finalOnReject);
            }
          },

          /**
           * Promise .catch() handler - delegates to .then()
           * @param {Function} onReject - Error handler
           * @returns {Promise} Promise for chaining
           */
          catch(onReject) {
            return this.then(null, onReject);
          },

          /**
           * Promise .finally() handler - delegates to .then()
           * @param {Function} onFinally - Cleanup handler
           * @returns {Promise} Promise for chaining
           */
          finally(onFinally) {
            return this.then(
              (value) => Promise.resolve(onFinally && onFinally()).then(() => value),
              (reason) => Promise.resolve(onFinally && onFinally()).then(() => Promise.reject(reason))
            );
          }
        };

        return api;
      };
    }
  });
}

// Make available globally for use in client-side HTML code
if (typeof window !== 'undefined') {
  window.createGasServer = createGasServer;

  // Storage for the server instance
  window._serverInstance = null;
  window._serverInitError = null;
  window._serverReadyCallbacks = [];

  /**
   * Initialize the server instance
   * @returns {boolean} True if successfully initialized
   */
  function initializeServer() {
    if (window._serverInstance) {
      return true; // Already initialized
    }

    // Check if google.script.run is available
    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      return false; // Not yet available
    }

    try {
      window._serverInstance = createGasServer({ debug: false });
      console.log('[gas_client] Server instance created successfully');

      // Notify any waiting callbacks
      while (window._serverReadyCallbacks.length > 0) {
        var callback = window._serverReadyCallbacks.shift();
        try {
          callback(window._serverInstance);
        } catch (e) {
          console.error('[gas_client] Error in ready callback:', e);
        }
      }

      return true;
    } catch (e) {
      window._serverInitError = e;
      console.error('[gas_client] Failed to create server instance:', e.message);
      return false;
    }
  }

  /**
   * Wait for server to be ready (Promise-based)
   * @param {number} timeoutMs - Maximum wait time (default 10000ms)
   * @returns {Promise<object>} Resolves with server instance
   */
  window.waitForServer = function(timeoutMs) {
    timeoutMs = timeoutMs || 10000;

    return new Promise(function(resolve, reject) {
      // Already initialized?
      if (window._serverInstance) {
        resolve(window._serverInstance);
        return;
      }

      // Previous error?
      if (window._serverInitError) {
        reject(window._serverInitError);
        return;
      }

      // Try to initialize now
      if (initializeServer()) {
        resolve(window._serverInstance);
        return;
      }

      // Set up timeout
      var timeoutId = setTimeout(function() {
        var idx = window._serverReadyCallbacks.indexOf(onReady);
        if (idx !== -1) window._serverReadyCallbacks.splice(idx, 1);
        reject(new Error('Timeout waiting for server after ' + timeoutMs + 'ms'));
      }, timeoutMs);

      function onReady(server) {
        clearTimeout(timeoutId);
        resolve(server);
      }

      window._serverReadyCallbacks.push(onReady);
    });
  };

  // Define window.server as a getter that tries to initialize on access
  Object.defineProperty(window, 'server', {
    get: function() {
      if (!window._serverInstance) {
        initializeServer();
      }
      return window._serverInstance;
    },
    configurable: true
  });

  // Try to initialize immediately
  if (!initializeServer()) {
    // Not ready yet - poll until google.script.run is available
    var initPollCount = 0;
    var initPollMax = 100; // 10 seconds max
    var initPollInterval = setInterval(function() {
      initPollCount++;
      if (initializeServer()) {
        clearInterval(initPollInterval);
        console.log('[gas_client] Server initialized after ' + (initPollCount * 100) + 'ms');
      } else if (initPollCount >= initPollMax) {
        clearInterval(initPollInterval);
        console.error('[gas_client] Gave up waiting for google.script.run after 10 seconds');
      }
    }, 100);
  }
}
</script>