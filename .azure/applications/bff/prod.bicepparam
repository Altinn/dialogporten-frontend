using './main.bicep'

param environment = 'prod'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.altinn.no'
param dialogportenURL = 'https://altinn-prod-api.azure-api.net/dialogporten'
param authContextCookieDomain = '.altinn.no'
param oicdUrl = 'idporten.no'
param altinn2BaseUrl = 'https://altinn.no'
param minReplicas = 2
param maxReplicas = 15
param resources = {
  cpu: 1
  memory: '2Gi'
}
param graphiQLEnabled = 'false'
param workloadProfileName = 'Dedicated-D4'
param oidcPlatformUrl = 'platform.altinn.no/authentication/api/v1/openid'

param platformBaseUrl = 'https://platform.altinn.no'
param enableInitSessionEndpoint = 'false'
param logoutRedirectUri = 'https://altinn.no/ui/Authentication/Logout'

param ocPApimSubscriptionKey = readEnvironmentVariable('OCP_APIM_SUBSCRIPTION_KEY')

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')

param additionalEnvironmentVariables = [
  {
    name: 'ENABLE_NEW_OIDC'
    value: 'true'
  }
  {
    name: 'TEST_ENV'
    value: 'false'
  }
  {
    name: 'OTEL_TRACES_SAMPLER_ARG'
    value: '0.1'
  }
]
