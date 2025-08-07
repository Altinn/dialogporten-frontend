/*
 * Options for the k6 test script.
*/
import { queryLabels } from "./queries.js";  
export function getOptions( browserTest = 'browserTest', bffTest = 'bffTest' ) {
    // Set default values for environment variables
    const browser_vus = __ENV.BROWSER_VUS || 1;
    const bff_vus = __ENV.BFF_VUS || 1;
    const duration = __ENV.DURATION || '1m';
    const breakpoint = __ENV.BREAKPOINT || false;
    const abort_on_fail = __ENV.ABORT_ON_FAIL || false;
    
    // Options placeholder
    const options = {
      scenarios: {},
      thresholds: {
      checks: ['rate==1.0']
      },
      summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(75)', 'p(95)', 'count'],
    }
  
    // Set browser scenario if browser_vus is greater than 0
    if (browser_vus > 0) {
      options.scenarios.browser = {
        executor: 'constant-vus',
        exec: browserTest,
        vus: browser_vus,
        duration: duration,
        options: {
          browser: {
            type: 'chromium',
          },
        },
      };
    }
  
    // Set BFF scenario if bff_vus is greater than 0
    if (bff_vus > 0) {
      options.scenarios.bff = {
        exec: bffTest,
      };
  
      // Set executor and stages based on breakpoint
      if (breakpoint) {
        options.scenarios.bff.executor = 'ramping-vus',
        options.scenarios.bff.stages = [
          {
            duration: duration,
            target: bff_vus,
          },
        ]
        // Set thresholds for each query label when breakpoint is true
        for (var label of queryLabels) {
          options.thresholds[[`http_req_duration{name:${label}}`]] = [{ threshold: "max<5000", abortOnFail: abort_on_fail }];
          options.thresholds[[`http_req_failed{name:${label}}`]] = [{ threshold: 'rate<=0.0', abortOnFail: abort_on_fail }];
        }
      } 
      // If breakpoint is false, use constant-vus executor
      else {
        options.scenarios.bff.executor = 'constant-vus';
        options.scenarios.bff.vus = bff_vus;
        options.scenarios.bff.duration = duration;
        for (var label of queryLabels) {
          options.thresholds[`http_req_duration{name:${label}}`] = [];
          options.thresholds[`http_req_failed{name:${label}}`] = [];
        }
      }
    }
    return options;
  }