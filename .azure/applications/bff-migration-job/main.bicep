targetScope = 'resourceGroup'

@minLength(3)
param imageTag string
@minLength(3)
param environment string
@minLength(3)
param location string
@minLength(3)
param oicdUrl string

@minLength(3)
@secure()
param containerAppEnvironmentName string
@minLength(3)
@secure()
param environmentKeyVaultName string

@description('The workload profile name to use, defaults to "Consumption"')
param workloadProfileName string = 'Consumption'

var namePrefix = 'dp-fe-${environment}'
var baseImageUrl = 'ghcr.io/altinn/dialogporten-frontend-'
var containerAppJobName = '${namePrefix}-bff-migration-job'
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
  identity: 'system'
}

var redisConnectionStringSecret = {
  name: 'redis-connection-string'
  keyVaultUrl: '${keyVaultUrl}/redisConnectionString'
  identity: 'system'
}

var idPortenClientIdSecret = {
  name: 'id-porten-client-id'
  keyVaultUrl: '${keyVaultUrl}/idPortenClientId'
  identity: 'system'
}

var idPortenClientSecretSecret = {
  name: 'id-porten-client-secret'
  keyVaultUrl: '${keyVaultUrl}/idPortenClientSecret'
  identity: 'system'
}

var idPortenSessionSecretSecret = {
  name: 'id-porten-session-secret'
  keyVaultUrl: '${keyVaultUrl}/idPortenSessionSecret'
  identity: 'system'
}

var secrets = [
  dbConnectionStringSecret
  redisConnectionStringSecret
  idPortenClientIdSecret
  idPortenClientSecretSecret
  idPortenSessionSecretSecret
]

var containerAppEnvVars = [
  {
    name: 'OTEL_EXPORTER_OTLP_ENDPOINT'
    value: 'http://localhost:4318'
  }
  {
    name: 'OTEL_EXPORTER_OTLP_PROTOCOL'
    value: 'http/protobuf'
  }
  {
    name: 'DB_CONNECTION_STRING'
    secretRef: dbConnectionStringSecret.name
  }
  {
    name: 'REDIS_CONNECTION_STRING'
    secretRef: redisConnectionStringSecret.name
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
    name: 'SESSION_SECRET'
    secretRef: idPortenSessionSecretSecret.name
  }
  {
    name: 'MIGRATION_RUN'
    value: 'true'
  }
  {
    name: 'TYPEORM_SYNCHRONIZE_ENABLED'
    value: ''
  }
  {
    name: 'LOGGER_FORMAT'
    value: 'json'
  }
  {
    name: 'NODE_ENV'
    value: 'production'
  }
]

module containerAppJob '../../modules/containerAppJob/main.bicep' = {
  name: containerAppJobName
  params: {
    name: containerAppJobName
    location: location
    image: '${baseImageUrl}node-bff:${imageTag}'
    containerAppEnvId: containerAppEnvironment.id
    environmentVariables: containerAppEnvVars
    secrets: secrets
    command: ['pnpm', '--filter', 'bff', 'run', 'start']
    tags: tags
    workloadProfileName: workloadProfileName
  }
}

module keyVaultReaderAccessPolicy '../../modules/keyvault/addReaderRoles.bicep' = {
  name: 'keyVaultReaderAccessPolicy-${containerAppJobName}'
  params: {
    keyvaultName: environmentKeyVaultResource.name
    principalIds: [containerAppJob.outputs.identityPrincipalId]
  }
}

output name string = containerAppJob.outputs.name
