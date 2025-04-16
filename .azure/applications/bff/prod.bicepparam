using './main.bicep'

param environment = 'prod'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.altinn.no'
param dialogportenURL = 'https://altinn-prod-api.azure-api.net/dialogporten/graphql'
param oicdUrl = 'idporten.no'
param minReplicas = 2
param maxReplicas = 3
param graphiQLEnabled = 'false'

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param appInsightConnectionString = readEnvironmentVariable('APP_INSIGHTS_CONNECTION_STRING')
