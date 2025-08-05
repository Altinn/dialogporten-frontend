using './main.bicep'

param environment = 'yt01'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.yt.altinn.cloud'
param dialogportenURL = 'https://platform.yt01.altinn.cloud/dialogporten/graphql'
param oicdUrl = 'test.idporten.no'
param minReplicas = 2
param maxReplicas = 3
param workloadProfileName = 'Consumption'
param enableInitSessionEndpoint = 'true'

param platformExchangeTokenEndpointUrl = 'https://platform.yt01.altinn.cloud/authentication/api/v1/exchange/id-porten?test=true'
param platformProfileApiUrl = 'https://platform.yt01.altinn.cloud/profile/api/v1/'

param ocPApimSubscriptionKey = readEnvironmentVariable('OCP_APIM_SUBSCRIPTION_KEY')

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param appInsightConnectionString = readEnvironmentVariable('APP_INSIGHTS_CONNECTION_STRING')
