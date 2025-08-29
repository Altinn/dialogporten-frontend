using './main.bicep'

param environment = 'staging'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.tt.altinn.no'
param dialogportenURL = 'https://altinn-tt02-api.azure-api.net/dialogporten/graphql'
param oicdUrl = 'test.idporten.no'
param minReplicas = 2
param maxReplicas = 3
param resources = {
    cpu: 1
    memory: '2Gi'
}
param workloadProfileName = 'Consumption'
param logoutRedirectUri = 'https://tt02.altinn.no'

param platformExchangeTokenEndpointUrl = 'https://platform.tt02.altinn.no/authentication/api/v1/exchange/id-porten?test=true'
param platformProfileApiUrl = 'https://platform.tt02.altinn.no/profile/api/v1/'

param ocPApimSubscriptionKey = readEnvironmentVariable('OCP_APIM_SUBSCRIPTION_KEY')

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param appInsightConnectionString = readEnvironmentVariable('APP_INSIGHTS_CONNECTION_STRING')
