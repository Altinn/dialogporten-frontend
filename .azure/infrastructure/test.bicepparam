using './main.bicep'

param environment = 'test'
param location = 'norwayeast'
param redisVersion = '6.0'

param keyVaultSourceKeys = json(readEnvironmentVariable('KEY_VAULT_SOURCE_KEYS'))

// secrets
param dialogportenPgAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD')
param sourceKeyVaultSubscriptionId = readEnvironmentVariable('SOURCE_KEY_VAULT_SUBSCRIPTION_ID')
param sourceKeyVaultResourceGroup = readEnvironmentVariable('SOURCE_KEY_VAULT_RESOURCE_GROUP')
param sourceKeyVaultName = readEnvironmentVariable('SOURCE_KEY_VAULT_NAME')
param sourceKeyVaultSshJumperSshPublicKey = readEnvironmentVariable('SOURCE_KEY_VAULT_SSH_JUMPER_SSH_PUBLIC_KEY')

// SKUs
param redisSku = {
  name: 'Basic'
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
    maxCapacity: 2
  }
  hostName: 'af.at.altinn.cloud'
  sslCertificate: {
    keyVaultName: readEnvironmentVariable('CERTIFICATE_KEY_VAULT_NAME')
    secretKey: 'star-at-altinn-cloud'
  }
}

// PostgreSQL Configuration
param postgresConfiguration = {
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  storage: {
    storageSizeGB: 256
    autoGrow: 'Enabled'
    type: 'Premium_LRS'
  }
  highAvailability: {
    mode: 'Disabled'
  }
  backupRetentionDays: 7
  availabilityZone: '3'
  version: '15'
}

// Altinn Product Dialogporten: Developers Dev
param entraDevelopersGroupId = 'c12e51e3-5cbd-4229-8a31-5394c423fb5f'

// Maintenance Mode
param enableMaintenancePage = false
