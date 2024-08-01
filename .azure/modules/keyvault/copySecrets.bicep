// Source
param srcKeyVaultKeys array
param srcKeyVaultName string
param srcKeyVaultRGNName string = resourceGroup().name
param srcKeyVaultSubId string = subscription().subscriptionId

// Destination
param destKeyVaultName string
param destKeyVaultRGName string = resourceGroup().name
param destKeyVaultSubId string = subscription().subscriptionId

// Secret
#disable-next-line secure-secrets-in-params
param secretPrefix string
param removeSecretPrefix bool = true

@description('The tags to apply to the resources')
param tags object

var environmentKeys = [
  for key in srcKeyVaultKeys: {
    isEnvironemntKey: startsWith(key, secretPrefix)
    value: removeSecretPrefix ? replace(key, secretPrefix, '') : key
    fullName: key
  }
]

resource srcKeyVaultResource 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: srcKeyVaultName
  scope: resourceGroup(srcKeyVaultSubId, srcKeyVaultRGNName)
}

module secrets 'upsertSecret.bicep' = [
  for key in environmentKeys: if (key.isEnvironemntKey) {
    name: key.value
    scope: resourceGroup(destKeyVaultSubId, destKeyVaultRGName)
    params: {
      destKeyVaultName: destKeyVaultName
      secretName: key.value
      secretValue: srcKeyVaultResource.getSecret(key.fullName)
      tags: tags
    }
  }
]
