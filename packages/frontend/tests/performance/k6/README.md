# Performance Testing with K6

This document provides an overview of how to conduct performance testing using K6 in the Dialogporten Frontend project.

## Prerequisites
* Either
  * [Grafana K6](https://k6.io/) must be installed and `k6` available in `PATH` 
  * or Docker (available av `docker` in `PATH`)
* Powershell or Bash (should work on any platform supported by K6)

## Test Scripts

- **testAfBrowserAndBff.js**: This script tests the performance of the browser and backend-for-frontend (BFF) interactions. The browser part will open a browser, select a random party and go to af (arbeidsflate) and interact with thje af interface. The bff interactions will try to simulate the af browser behaviour in the best possible way, also with a random party for each iteration.

## Test data
Lists of parties (endusers) with dialogs are stored in `packages/frontend/tests/performance/k6/testData` for `at and tt`, named `usersWithDialogs-<environment>.csv`. Environment must be one of `at or tt`.
For `yt`, testdata are given by the tokengenarator

## Running tests
### From cli
1. Navigate to the following directory:
```shell
cd packages/frontend/tests/performance/k6
```
2. Run the test using the following command. Replace the values inside <> with proper values:
```shell
TOKEN_GENERATOR_USERNAME=<username> TOKEN_GENERATOR_PASSWORD=<passwd> \
tests/testAfBrowserAndBff.js \
-e BROWSER_VUS=<browser-vus> \
-e BFF_VUS=<bff-vus> \
-e DURATION=<duration> \
-e ENVIRONMENT=<enviromnment>
-e BREAKPOINT=<breakpoint>
-e ABORT_ON_FAIL=<abort_on-_fail>
-e RANDOMIZE=<randomize>
```
* BROWSER_VUS: Number of browser VUs (Virtual Users) to run. Default `1`
* BFF_VUS: Number of bff VUs to run. Default `1`
* DURATION: Duration of test, eg 2m (2 minutes), 30s (30 seconds). Default `1m`
* ENVIRONMENT: Test environment to run the test in, must be one of `yt, at or tt`. Default `yt`
* BREAKPOINT: Run breakpiont test. Number of VUs will steadily increase to BFF_VUS over the test DURATION. Default `false`
* ABORT_ON_FAIL: Only used toghether with BREAKPOINT. Will abort the test if test thresholds are exceeded. Default `false`
* RANDOMIZE: Randomize the order endusers are run. Only for `at and tt`. Default `false`


### From GitHub Actions
To run the performance test using GitHub Actions, follow these steps:
1. Go to the [GitHub Actions](https://github.com/altinn/dialogporten-frontend/actions/workflows/run-performance-tests.yml) page.
2. Select "Run workflow" and fill in the required parameters. See above for details
3. Tag the performance test with a descriptive name.


## Reporting

Test results can be found in GitHub action run log and in [grafana](https://altinn-grafana-test-b2b8dpdkcvfuhfd3.eno.grafana.azure.com/d/ccbb2351-2ae2-462f-ae0e-f2c893ad1028/k6-prometheus?orgId=1&from=now-30m&to=now&timezone=browser&var-DS_PROMETHEUS=k6tests-amw&var-namespace=&var-testid=$__all&var-quantile_stat=p99&var-adhoc_filter=&refresh=30s).  