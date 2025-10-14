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

param platformBaseUrl = 'https://platform.altinn.no'
param enableInitSessionEndpoint = 'false'
param disableProfile = 'false'
param logoutRedirectUri = 'https://altinn.no/ui/Authentication/Logout'


param ocPApimSubscriptionKey = readEnvironmentVariable('OCP_APIM_SUBSCRIPTION_KEY')

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param appInsightConnectionString = readEnvironmentVariable('APP_INSIGHTS_CONNECTION_STRING')
