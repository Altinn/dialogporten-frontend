param namePrefix string
param location string
param adminObjectIds array = []

@description('The tags to apply to the resources')
param tags object

var adminAccessPolicies = [
  for admin in adminObjectIds: {
    objectId: admin
    tenantId: subscription().tenantId
    permissions: {
      keys: ['all']
      secrets: ['all']
      certificates: ['all']
    }
  }
]

var keyvaultName = take('${namePrefix}-kv-${uniqueString(resourceGroup().id)}', 24)

resource keyvault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyvaultName
  location: location
  properties: {
    enablePurgeProtection: true
    enabledForTemplateDeployment: false
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: adminAccessPolicies
    enableRbacAuthorization: true
  }
  tags: tags
}

output name string = keyvault.name
output vaultUri string = keyvault.properties.vaultUri
