targetScope = 'resourceGroup'

@minLength(3)
param imageTag string
@minLength(3)
param environment string
@minLength(3)
param location string
param port int = 80
@minLength(3)
param hostName string
@minLength(3)
param dialogportenURL string
@minLength(3)
param oicdUrl string
param oidcPlatformUrl string = 'platform.at23.altinn.cloud/authentication/api/v1/openid'
param minReplicas int
param maxReplicas int
@description('CPU and memory resources for the container app')
param resources object?

param platformBaseUrl string

@secure()
param ocPApimSubscriptionKey string

@description('Controls whether GraphiQL interface is enabled. Should be disabled in production.')
@allowed([
  'false'
  'true'
])
param graphiQLEnabled string = 'true'
param enableInitSessionEndpoint string = 'true'

@description('URL to direct user after successful logout')
param logoutRedirectUri string = 'https://altinn.no/ui/Authentication/Logout'

@minLength(3)
@secure()
param containerAppEnvironmentName string
@minLength(3)
@secure()
param environmentKeyVaultName string

@description('Additional environment variables to be added to the container app')
param additionalEnvironmentVariables array = []

@description('The workload profile name to use, defaults to "Consumption"')
param workloadProfileName string = 'Consumption'

var namePrefix = 'dp-fe-${environment}'
var baseImageUrl = 'ghcr.io/altinn/dialogporten-frontend-'
var containerAppName = '${namePrefix}-bff'
var tags = {
  Environment: environment
  Product: 'Arbeidsflate'
}

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerAppEnvironmentName
}

resource environmentKeyVaultResource 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: environmentKeyVaultName
}

// https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-functions-deployment#example-1
var keyVaultUrl = 'https://${environmentKeyVaultName}${az.environment().suffixes.keyvaultDns}/secrets'

var dbConnectionStringSecret = {
  name: 'db-connection-string'
  keyVaultUrl: '${keyVaultUrl}/databaseConnectionString'
  identity: 'System'
}

var redisConnectionStringSecret = {
  name: 'redis-connection-string'
  keyVaultUrl: '${keyVaultUrl}/redisConnectionString'
  identity: 'System'
}

var idPortenClientIdSecret = {
  name: 'id-porten-client-id'
  keyVaultUrl: '${keyVaultUrl}/idPortenClientId'
  identity: 'System'
}

var idPortenClientSecretSecret = {
  name: 'id-porten-client-secret'
  keyVaultUrl: '${keyVaultUrl}/idPortenClientSecret'
  identity: 'System'
}

var oidcClientId = {
  name: 'oidc-client-id'
  keyVaultUrl: '${keyVaultUrl}/oidcClientId'
  identity: 'System'
}

var oidcClientSecret = {
  name: 'oidc-client-secret'
  keyVaultUrl: '${keyVaultUrl}/oidcClientSecret'
  identity: 'System'
}

var idPortenSessionSecretSecret = {
  name: 'id-porten-session-secret'
  keyVaultUrl: '${keyVaultUrl}/idPortenSessionSecret'
  identity: 'System'
}

var appConfigConnectionStringSecret = {
  name: 'app-config-connection-string'
  keyVaultUrl: '${keyVaultUrl}/appConfigConnectionString'
  identity: 'System'
}

var secrets = [
  dbConnectionStringSecret
  redisConnectionStringSecret
  idPortenClientIdSecret
  idPortenClientSecretSecret
  idPortenSessionSecretSecret
  appConfigConnectionStringSecret
]

var containerAppEnvVars = concat(
  [
    {
      name: 'DB_CONNECTION_STRING'
      secretRef: dbConnectionStringSecret.name
    }
    {
      name: 'REDIS_CONNECTION_STRING'
      secretRef: redisConnectionStringSecret.name
    }
    {
      name: 'PORT'
      value: '${port}'
    }
    {
      name: 'HOSTNAME'
      value: hostName
    }
    {
      name: 'CLIENT_ID'
      secretRef: idPortenClientIdSecret.name
    }
    {
      name: 'CLIENT_SECRET'
      secretRef: idPortenClientSecretSecret.name
    }
    {
      name: 'OIDC_URL'
      value: oicdUrl
    }
    {
      name: 'OIDC_CLIENT_ID'
      secretRef: oidcClientId.name
    }
    {
      name: 'OIDC_CLIENT_SECRET'
      secretRef: oidcClientSecret.name
    }
    {
      name: 'OIDC_PLATFORM_URL'
      value: oidcPlatformUrl
    }
    {
      name: 'SESSION_SECRET'
      secretRef: idPortenSessionSecretSecret.name
    }
    {
      name: 'TYPEORM_SYNCHRONIZE_ENABLED'
      value: ''
    }
    {
      name: 'DIALOGPORTEN_URL'
      value: dialogportenURL
    }
    {
      name: 'LOGGER_FORMAT'
      value: 'json'
    }
    {
      name: 'NODE_ENV'
      value: 'production'
    }
    {
      name: 'ENABLE_GRAPHIQL'
      value: graphiQLEnabled
    }
    {
      name: 'ENABLE_INIT_SESSION_ENDPOINT'
      value: enableInitSessionEndpoint
    }
    {
      name: 'PLATFORM_BASEURL'
      value: platformBaseUrl
    }
    {
      name: 'OCP_APIM_SUBSCRIPTION_KEY'
      value: ocPApimSubscriptionKey
    }
    {
        name: 'LOGOUT_REDIRECT_URI'
        value: logoutRedirectUri
    }
    {
        name: 'APP_CONFIG_CONNECTION_STRING'
        secretRef: appConfigConnectionStringSecret.name
    }
  ],
  additionalEnvironmentVariables
)

module containerApp '../../modules/containerApp/main.bicep' = {
  name: containerAppName
  params: {
    name: containerAppName
    location: location
    image: '${baseImageUrl}node-bff:${imageTag}'
    containerAppEnvId: containerAppEnvironment.id
    secrets: secrets
    environmentVariables: containerAppEnvVars
    port: port
    minReplicas: minReplicas
    maxReplicas: maxReplicas
    resources: resources
    tags: tags
    workloadProfileName: workloadProfileName
  }
}

module keyVaultReaderAccessPolicy '../../modules/keyvault/addReaderRoles.bicep' = {
  name: 'keyVaultReaderAccessPolicy-${containerAppName}'
  params: {
    keyvaultName: environmentKeyVaultResource.name
    principalIds: [containerApp.outputs.identityPrincipalId]
  }
}

output name string = containerApp.outputs.name
output revisionName string = containerApp.outputs.revisionName
