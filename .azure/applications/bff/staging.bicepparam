using './main.bicep'

param environment = 'staging'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.tt.altinn.no'
param dialogportenURL = 'https://altinn-tt02-api.azure-api.net/dialogporten'
param oidcPlatformUrl = 'platform.tt02.altinn.no/authentication/api/v1/openid'
param altinn2BaseUrl = 'https://tt02.altinn.no'
param oicdUrl = 'test.idporten.no'
param authContextCookieDomain = '.tt02.altinn.no'
param minReplicas = 2
param maxReplicas = 3
param resources = {
    cpu: 1
    memory: '2Gi'
}
param workloadProfileName = 'Consumption'
param logoutRedirectUri = 'https://tt02.altinn.no/ui/Authentication/Logout'

param platformBaseUrl = 'https://platform.tt02.altinn.no'

param ocPApimSubscriptionKey = readEnvironmentVariable('OCP_APIM_SUBSCRIPTION_KEY')

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')

param additionalEnvironmentVariables = [
  {
    name: 'ENABLE_NEW_OIDC'
    value: 'true'
  }
]
