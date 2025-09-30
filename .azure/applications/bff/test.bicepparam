using './main.bicep'

param environment = 'test'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.at.altinn.cloud'
param dialogportenURL = 'https://altinn-dev-api.azure-api.net/dialogporten'
param oicdUrl = 'test.idporten.no'
param minReplicas = 2
param maxReplicas = 3
param workloadProfileName = 'Consumption'
param logoutRedirectUri = 'https://at23.altinn.cloud'

param platformBaseUrl = 'https://platform.at23.altinn.cloud'

param ocPApimSubscriptionKey = readEnvironmentVariable('OCP_APIM_SUBSCRIPTION_KEY')
param disableProfile = 'false'

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param appInsightConnectionString = readEnvironmentVariable('APP_INSIGHTS_CONNECTION_STRING')

param additionalEnvironmentVariables = [
  {
    name: 'COOKIE_SECURE'
    value: 'false'
  }
  {
    name: 'COOKIE_HTTP_ONLY'
    value: 'false'
  }
  {
    name: 'APPLICATIONINSIGHTS_ENABLED'
    value: 'false'
  }
]
