using './main.bicep'

param environment = 'prod'
param location = 'norwayeast'
param redisVersion = '6.0'

param keyVaultSourceKeys = json(readEnvironmentVariable('KEY_VAULT_SOURCE_KEYS'))

// secrets
param dialogportenPgAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD')
param sourceKeyVaultSubscriptionId = readEnvironmentVariable('SOURCE_KEY_VAULT_SUBSCRIPTION_ID')
param sourceKeyVaultResourceGroup = readEnvironmentVariable('SOURCE_KEY_VAULT_RESOURCE_GROUP')
param sourceKeyVaultName = readEnvironmentVariable('SOURCE_KEY_VAULT_NAME')
param sourceKeyVaultSshJumperSshPublicKey = readEnvironmentVariable('SOURCE_KEY_VAULT_SSH_JUMPER_SSH_PUBLIC_KEY')

param applicationGatewayWhitelistedIps = json(readEnvironmentVariable('APPLICATION_GATEWAY_WHITELISTED_IPS', '[]'))

// Backup vault for PostgreSQL (storage account + container for now)
param enableBackupVault = true

// SKUs
param redisSku = {
  name: 'Standard'
  family: 'C'
  capacity: 1
}

param applicationGatewayConfiguration = {
  sku: {
    name: 'Standard_v2'
    tier: 'Standard_v2'
  }
  autoscaleConfiguration: {
    minCapacity: 1
    maxCapacity: 4
  }
  hostNames: [
    {
      name: 'af.altinn.no'
      sslCertificateSecretKey: 'af-altinn-no'
      enableAvailabilityTest: true
    }
  ]
  sslCertificateKeyVaultName: readEnvironmentVariable('CERTIFICATE_KEY_VAULT_NAME')
  zones: ['1', '2']
}

// PostgreSQL Configuration
param postgresConfiguration = {
  sku: {
    name: 'Standard_D2ads_v5'
    tier: 'GeneralPurpose'
  }
  storage: {
    storageSizeGB: 256
    autoGrow: 'Enabled'
    type: 'Premium_LRS'
  }
  highAvailability: {
    mode: 'ZoneRedundant'
    standbyAvailabilityZone: '1'
  }
  backupRetentionDays: 32
  availabilityZone: '2'
  version: '15'
}

// Altinn Product Dialogporten: Developers Prod
param entraDevelopersGroupId = 'a94de4bf-0a83-4d30-baba-0c6a7365571c'

// Container App Environment
param containerAppEnvZoneRedundancyEnabled = true

param containerAppEnvWorkloadProfiles = [
  {
    name: 'Consumption'
    workloadProfileType: 'Consumption'
  }
  {
    name: 'Dedicated-D4'
    workloadProfileType: 'D4'
    minimumCount: 3
    maximumCount: 10
  }
]
// Maintenance Mode
param enableMaintenancePage = false
