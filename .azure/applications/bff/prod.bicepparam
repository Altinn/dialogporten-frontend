using './main.bicep'

param environment = 'prod'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.altinn.no'
param dialogportenURL = 'https://altinn-prod-api.azure-api.net/dialogporten'
param oicdUrl = 'idporten.no'
param minReplicas = 2
param maxReplicas = 3
param graphiQLEnabled = 'false'
param workloadProfileName = 'Consumption'

param platformExchangeTokenEndpointUrl = 'https://platform.altinn.no/authentication/api/v1/exchange/id-porten'
param platformProfileApiUrl = 'https://platform.altinn.no/profile/api/v1/'
param enableInitSessionEndpoint = 'false'
param disableProfile = 'true'
param logoutRedirectUri = 'https://altinn.no'


param ocPApimSubscriptionKey = readEnvironmentVariable('OCP_APIM_SUBSCRIPTION_KEY')

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param appInsightConnectionString = readEnvironmentVariable('APP_INSIGHTS_CONNECTION_STRING')
