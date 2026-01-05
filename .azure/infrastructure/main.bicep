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

@description('The object ID of the group to assign the Admin Login role for SSH Jumper and Storage Blob Data Reader role for source maps')
param entraDevelopersGroupId string

@description('Whether to enable zone redundancy for the container app environment')
param containerAppEnvZoneRedundancyEnabled bool = false

@description('Workload profiles to enable in the container app environment')
param containerAppEnvWorkloadProfiles array = [
  {
    name: 'Consumption'
    workloadProfileType: 'Consumption'
  }
]

import { Sku as RedisSku } from '../modules/redis/main.bicep'
param redisSku RedisSku
@minLength(1)
param redisVersion string

import { Configuration as ApplicationGatewayConfiguration } from '../modules/applicationGateway/main.bicep'
param applicationGatewayConfiguration ApplicationGatewayConfiguration

@description('Optional list of IP addresses/ranges to whitelist for incoming traffic')
param applicationGatewayWhitelistedIps array = []

@description('Enable maintenance mode to redirect all traffic to maintenance page')
param enableMaintenancePage bool = false

@description('Whether to provision the backup vault storage account + container (env-specific, controlled via bicepparam)')
param enableBackupVault bool = false

// PostgreSQL configuration parameters
import { Sku as PostgreSQLSku } from '../modules/postgreSql/create.bicep'
import { StorageConfiguration as PostgreSQLStorageConfiguration } from '../modules/postgreSql/create.bicep'
import { HighAvailabilityConfiguration as PostgreSQLHighAvailabilityConfiguration } from '../modules/postgreSql/create.bicep'

param postgresConfiguration {
  sku: PostgreSQLSku
  storage: PostgreSQLStorageConfiguration
  highAvailability: PostgreSQLHighAvailabilityConfiguration?
  backupRetentionDays: int
  availabilityZone: string
  version: string
}

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

module appInsights '../modules/applicationInsights/create.bicep' = {
  scope: resourceGroup
  name: 'appInsights'
  params: {
    namePrefix: namePrefix
    location: location
    tags: tags
    sourceMapsReaderGroupObjectId: entraDevelopersGroupId
  }
}

// Get hostnames with availability test enabled
var availabilityTestHostNames = filter(applicationGatewayConfiguration.hostNames, h => h.enableAvailabilityTest)

module bffAvailabilityTests '../modules/applicationInsights/availabilityTest.bicep' = [for (hostname, i) in availabilityTestHostNames: {
  scope: resourceGroup
  name: 'bffAvailabilityTest-${replace(hostname.name, '.', '-')}'
  params: {
    name: 'BFF - ${environment} - ${hostname.name}'
    location: location
    tags: tags
    appInsightsId: appInsights.outputs.appInsightsId
    url: 'https://${hostname.name}/api/health'
  }
}]

module frontendAvailabilityTests '../modules/applicationInsights/availabilityTest.bicep' = [for (hostname, i) in availabilityTestHostNames: {
  scope: resourceGroup
  name: 'frontendAvailabilityTest-${replace(hostname.name, '.', '-')}'
  params: {
    name: 'Frontend - ${environment} - ${hostname.name}'
    location: location
    tags: tags
    appInsightsId: appInsights.outputs.appInsightsId
    url: 'https://${hostname.name}'
  }
}]

module appConfiguration '../modules/appConfiguration/main.bicep' = {
  scope: resourceGroup
  name: 'appConfiguration'
  params: {
    namePrefix: namePrefix
    location: location
    tags: tags
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
    zoneRedundancyEnabled: containerAppEnvZoneRedundancyEnabled
    workloadProfiles: containerAppEnvWorkloadProfiles
    appInsightsConnectionString: appInsights.outputs.connectionString
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
    configuration: applicationGatewayConfiguration
    appInsightWorkspaceName: appInsights.outputs.appInsightsWorkspaceName
    enableMaintenancePage: enableMaintenancePage
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
    sku: postgresConfiguration.sku
    storage: postgresConfiguration.storage
    highAvailability: postgresConfiguration.?highAvailability
    availabilityZone: postgresConfiguration.availabilityZone
    backupRetentionDays: postgresConfiguration.backupRetentionDays
    postgresVersion: postgresConfiguration.version
    tags: tags
    enableBackupVault: enableBackupVault
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
    adminLoginGroupObjectId: entraDevelopersGroupId
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

output resourceGroupName string = resourceGroup.name
output postgreServerName string = postgresql.outputs.serverName
output appInsightsSourceMapStorageAccountName string = appInsights.outputs.sourceMapStorageAccountName
output appInsightsSourceMapContainerName string = appInsights.outputs.sourceMapContainerName
output appConfigurationName string = appConfiguration.outputs.name
output appConfigurationEndpoint string = appConfiguration.outputs.endpoint
