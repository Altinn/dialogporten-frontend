using './main.bicep'

param environment = 'yt01'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.yt01.altinn.cloud'
param dialogportenURL = 'https://platform.yt01.altinn.cloud/dialogporten'
param oicdUrl = 'test.idporten.no'
param minReplicas = 2
param maxReplicas = 15
param resources = {
    cpu: 1
    memory: '2Gi'
}
param workloadProfileName = 'Dedicated-D4'
param logoutRedirectUri = 'https://tt02.altinn.no/ui/Authentication/Logout'
param authContextCookieDomain = '.yt01.altinn.cloud'
param oidcPlatformUrl = 'platform.yt01.altinn.cloud/authentication/api/v1/openid'
param platformBaseUrl = 'https://platform.yt01.altinn.cloud'
param altinn2BaseUrl = 'https://yt01.altinn.cloud'

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

