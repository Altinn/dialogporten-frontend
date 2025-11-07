using './main.bicep'

param environment = 'yt01'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param hostName = 'https://af.yt.altinn.cloud'
param dialogportenURL = 'https://platform.yt01.altinn.cloud/dialogporten'
param oicdUrl = 'test.idporten.no'
param minReplicas = 2
param maxReplicas = 3
param workloadProfileName = 'Consumption'
param logoutRedirectUri = 'https://tt02.altinn.no/ui/Authentication/Logout'
param authContextCookieDomain = '.altinn.no'

param platformBaseUrl = 'https://platform.yt01.altinn.cloud'

param ocPApimSubscriptionKey = readEnvironmentVariable('OCP_APIM_SUBSCRIPTION_KEY')

// secrets
param environmentKeyVaultName = readEnvironmentVariable('ENVIRONMENT_KEY_VAULT_NAME')
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
