targetScope = 'subscription'

param environment string
param location string
param keyVaultSourceKeys array

@secure()
@minLength(3)
param dialogportenPgAdminPassword string
@secure()
@minLength(3)
param sourceKeyVaultSubscriptionId string
@secure()
@minLength(3)
param sourceKeyVaultResourceGroup string
@secure()
@minLength(3)
param sourceKeyVaultName string

@description('SSH public key for the ssh jumper')
@secure()
@minLength(3)
param sourceKeyVaultSshJumperSshPublicKey string

@description('The object ID of the group to assign the Admin Login role for SSH Jumper')
param sshJumperAdminLoginGroupObjectId string

import { Sku as RedisSku } from '../modules/redis/main.bicep'
param redisSku RedisSku
@minLength(1)
param redisVersion string

import { Configuration as ApplicationGatewayConfiguration } from '../modules/applicationGateway/main.bicep'
param applicationGatewayConfiguration ApplicationGatewayConfiguration

@description('Optional list of IP addresses/ranges to whitelist for incoming traffic')
param applicationGatewayWhitelistedIps array = []

var secrets = {
  dialogportenPgAdminPassword: dialogportenPgAdminPassword
  sourceKeyVaultSubscriptionId: sourceKeyVaultSubscriptionId
  sourceKeyVaultResourceGroup: sourceKeyVaultResourceGroup
  sourceKeyVaultName: sourceKeyVaultName
  sourceKeyVaultSshJumperSshPublicKey: sourceKeyVaultSshJumperSshPublicKey
}

var srcKeyVault = {
  name: secrets.sourceKeyVaultName
  subscriptionId: secrets.sourceKeyVaultSubscriptionId
  resourceGroupName: secrets.sourceKeyVaultResourceGroup
}

var tags = {
  Environment: environment
  Product: 'Arbeidsflate'
}

var namePrefix = 'dp-fe-${environment}'

// Create resource groups
resource resourceGroup 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: '${namePrefix}-rg'
  location: location
}

module vnet '../modules/vnet/main.bicep' = {
  scope: resourceGroup
  name: 'vnet'
  params: {
    namePrefix: namePrefix
    location: location
    tags: tags
    applicationGatewayWhitelistedIps: applicationGatewayWhitelistedIps
  }
}

module environmentKeyVault '../modules/keyvault/create.bicep' = {
  scope: resourceGroup
  name: 'keyVault'
  params: {
    namePrefix: namePrefix
    location: location
    tags: tags
  }
}

module appConfiguration '../modules/appConfiguration/create.bicep' = {
  scope: resourceGroup
  name: 'appConfiguration'
  params: {
    namePrefix: namePrefix
    location: location
    tags: tags
  }
}

module appInsights '../modules/applicationInsights/create.bicep' = {
  scope: resourceGroup
  name: 'appInsights'
  params: {
    namePrefix: namePrefix
    location: location
    tags: tags
  }
}

module bffAvailabilityTest '../modules/applicationInsights/availabilityTest.bicep' = {
  scope: resourceGroup
  name: 'bffAvailabilityTest'
  params: {
    name: 'BFF - ${environment}'
    location: location
    tags: tags
    appInsightsId: appInsights.outputs.appInsightsId
    url: 'https://${applicationGatewayConfiguration.hostName}/api/health'
  }
}

module frontendAvailabilityTest '../modules/applicationInsights/availabilityTest.bicep' = {
  scope: resourceGroup
  name: 'frontendAvailabilityTest'
  params: {
    name: 'Frontend - ${environment}'
    location: location
    tags: tags
    appInsightsId: appInsights.outputs.appInsightsId
    url: 'https://${applicationGatewayConfiguration.hostName}'
  }
}

module containerAppEnv '../modules/containerAppEnv/main.bicep' = {
  scope: resourceGroup
  name: 'containerAppEnv'
  params: {
    name: '${namePrefix}-containerappenv'
    location: location
    appInsightWorkspaceName: appInsights.outputs.appInsightsWorkspaceName
    subnetId: vnet.outputs.containerAppEnvironmentSubnetId
    tags: tags
  }
}

module containerAppEnvPrivateDnsZone '../modules/privateDnsZone/main.bicep' = {
  scope: resourceGroup
  name: 'containerAppEnvPrivateDnsZone'
  params: {
    namePrefix: namePrefix
    defaultDomain: containerAppEnv.outputs.defaultDomain
    vnetId: vnet.outputs.virtualNetworkId
    aRecords: [
      {
        ip: containerAppEnv.outputs.staticIp
        name: '*'
        ttl: 3600
      }
      {
        ip: containerAppEnv.outputs.staticIp
        name: '@'
        ttl: 3600
      }
    ]
    tags: tags
  }
}

module postgresqlPrivateDnsZone '../modules/privateDnsZone/main.bicep' = {
  scope: resourceGroup
  name: 'postgresqlPrivateDnsZone'
  params: {
    namePrefix: namePrefix
    defaultDomain: '${namePrefix}.postgres.database.azure.com'
    vnetId: vnet.outputs.virtualNetworkId
    tags: tags
  }
}

module applicationGateway '../modules/applicationGateway/main.bicep' = {
  scope: resourceGroup
  name: 'applicationGateway'
  params: {
    namePrefix: namePrefix
    location: location
    containerAppEnvName: containerAppEnv.outputs.name
    subnetId: vnet.outputs.applicationGatewaySubnetId
    targetSubnetId: vnet.outputs.containerAppEnvironmentSubnetId
    configuration: applicationGatewayConfiguration
    appInsightWorkspaceName: appInsights.outputs.appInsightsWorkspaceName
    tags: tags
  }
}

module redis '../modules/redis/main.bicep' = {
  scope: resourceGroup
  name: 'redis'
  params: {
    namePrefix: namePrefix
    location: location
    environmentKeyVaultName: environmentKeyVault.outputs.name
    version: redisVersion
    sku: redisSku
    subnetId: vnet.outputs.redisSubnetId
    vnetId: vnet.outputs.virtualNetworkId
    tags: tags
  }
}

// Create references to existing resources
resource srcKeyVaultResource 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: secrets.sourceKeyVaultName
  scope: az.resourceGroup(secrets.sourceKeyVaultSubscriptionId, secrets.sourceKeyVaultResourceGroup)
}

// Create resources with dependencies to other resources
module postgresql '../modules/postgreSql/create.bicep' = {
  scope: resourceGroup
  name: 'postgresql'
  params: {
    namePrefix: namePrefix
    subnetId: vnet.outputs.postgresqlSubnetId
    location: location
    keyVaultName: environmentKeyVault.outputs.name
    srcKeyVault: srcKeyVault
    srcSecretName: 'dialogportenPgAdminPassword${environment}'
    administratorLoginPassword: contains(keyVaultSourceKeys, 'dialogportenPgAdminPassword${environment}')
      ? srcKeyVaultResource.getSecret('dialogportenPgAdminPassword${environment}')
      : secrets.dialogportenPgAdminPassword
    privateDnsZoneArmResourceId: postgresqlPrivateDnsZone.outputs.id
    tags: tags
  }
}

module sshJumper '../modules/ssh-jumper/main.bicep' = {
  scope: resourceGroup
  name: 'sshJumper'
  params: {
    namePrefix: namePrefix
    location: location
    subnetId: vnet.outputs.sshJumperSubnetId
    tags: tags
    sshPublicKey: secrets.sourceKeyVaultSshJumperSshPublicKey
    adminLoginGroupObjectId: sshJumperAdminLoginGroupObjectId
  }
}

module copySecrets '../modules/keyvault/copySecrets.bicep' = {
  scope: resourceGroup
  name: 'copySecrets'
  params: {
    srcKeyVaultKeys: keyVaultSourceKeys
    srcKeyVaultName: srcKeyVault.name
    srcKeyVaultRGNName: srcKeyVault.resourceGroupName
    srcKeyVaultSubId: srcKeyVault.subscriptionId
    destKeyVaultName: environmentKeyVault.outputs.name
    secretPrefix: 'dialogporten--${environment}--'
    tags: tags
  }
}

module appConfigDatabaseConnectionString '../modules/appConfiguration/upsertKeyValue.bicep' = {
  scope: resourceGroup
  name: 'AppConfig_Add_DatabaseConnectionString'
  params: {
    configStoreName: appConfiguration.outputs.name
    key: 'DATABASE_CONNECTION_STRING'
    value: postgresql.outputs.connectionStringSecretUri
    keyValueType: 'keyVaultReference'
    tags: tags
  }
}

output resourceGroupName string = resourceGroup.name
output postgreServerName string = postgresql.outputs.serverName
