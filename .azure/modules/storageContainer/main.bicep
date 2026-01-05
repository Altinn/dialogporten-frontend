@description('Name of the storage account to create the container in')
param storageAccountName string

@description('Name of the blob container')
param containerName string

@description('Public access level for the container')
@allowed([
  'None'
  'Blob'
  'Container'
])
param publicAccess string = 'None'

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccountName}/default/${containerName}'
  properties: {
    publicAccess: publicAccess
  }
}

output containerId string = container.id
output containerName string = containerName
