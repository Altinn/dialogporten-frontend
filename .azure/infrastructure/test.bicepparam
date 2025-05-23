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

// Altinn Product Dialogporten: Developers Dev
param sshJumperAdminLoginGroupObjectId = 'c12e51e3-5cbd-4229-8a31-5394c423fb5f'
