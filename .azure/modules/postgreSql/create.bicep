@description('The prefix used for naming resources to ensure unique names')
param namePrefix string

@description('The location where the resources will be deployed')
param location string

@description('The name of the environment Key Vault')
param keyVaultName string

@description('The name of the secret name(key) in the source key vault to store the PostgreSQL administrator login password')
#disable-next-line secure-secrets-in-params
param srcSecretName string

@description('The ID of the subnet where the PostgreSQL server will be deployed')
param subnetId string

@description('The ARM resource ID of the private DNS zone')
param privateDnsZoneArmResourceId string

@description('Tags to apply to resources')
param tags object

@export()
type Sku = {
  name: 'Standard_B1ms' | 'Standard_B2s' | 'Standard_B4ms' | 'Standard_B8ms' | 'Standard_B12ms' | 'Standard_B16ms' | 'Standard_B20ms' | 'Standard_D4ads_v5' | 'Standard_D8ads_v5'
  tier: 'Burstable' | 'GeneralPurpose' | 'MemoryOptimized'
}

@description('The SKU of the PostgreSQL server')
param sku Sku

@export()
type StorageConfiguration = {
  @minValue(32)
  storageSizeGB: int
  autoGrow: 'Enabled' | 'Disabled'
  @description('The type of storage account to use. Default is Premium_LRS.')
  type: 'Premium_LRS' | 'PremiumV2_LRS'
}

@description('The storage configuration for the PostgreSQL server')
param storage StorageConfiguration

@export()
type HighAvailabilityConfiguration = {
  mode: 'ZoneRedundant' | 'SameZone' | 'Disabled'
  standbyAvailabilityZone: string?
}

@description('High availability configuration for the PostgreSQL server')
param highAvailability HighAvailabilityConfiguration?

@description('The availability zone for the PostgreSQL primary server')
param availabilityZone string

@description('The number of days to retain backups.')
@minValue(7)
@maxValue(35)
param backupRetentionDays int

@description('The Key Vault to store the PostgreSQL administrator login password')
@secure()
param srcKeyVault object

@description('The password for the PostgreSQL administrator login')
@secure()
param administratorLoginPassword string

@description('PostgreSQL version')
param postgresVersion string = '15'

var administratorLogin = 'dialogportenPgAdmin'
var databaseName = 'dialogporten'

module saveAdmPassword '../keyvault/upsertSecret.bicep' = {
  name: 'Save_${srcSecretName}'
  scope: resourceGroup(srcKeyVault.subscriptionId, srcKeyVault.resourceGroupName)
  params: {
    destKeyVaultName: srcKeyVault.name
    secretName: srcSecretName
    secretValue: administratorLoginPassword
    tags: tags
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: '${namePrefix}-postgres'
  location: location
  properties: {
    version: postgresVersion
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    storage: {
      storageSizeGB: storage.storageSizeGB
      autoGrow: storage.autoGrow
      type: storage.type
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: 'Disabled'
    }
    dataEncryption: {
      type: 'SystemManaged'
    }
    replicationRole: 'Primary'
    network: {
      delegatedSubnetResourceId: subnetId
      privateDnsZoneArmResourceId: privateDnsZoneArmResourceId
    }
    availabilityZone: availabilityZone
    highAvailability: highAvailability
  }
  sku: sku
  resource database 'databases' = {
    name: databaseName
  }
  tags: tags
}

var secretName = 'databaseConnectionString'
var secretValue = 'postgres://${administratorLogin}:${administratorLoginPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/${databaseName}?ssl=true'
module psqlConnectionObject '../keyvault/upsertSecret.bicep' = {
  name: secretName
  params: {
    destKeyVaultName: keyVaultName
    secretName: secretName
    secretValue: secretValue
    tags: tags
  }
}

output serverName string = postgres.name
output connectionStringSecretUri string = psqlConnectionObject.outputs.secretUri
