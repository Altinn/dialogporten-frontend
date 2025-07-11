param namePrefix string
param location string

@description('The tags to apply to the resources')
param tags object

@description('The blob container name for source maps')
param sourceMapContainerName string = 'sourcemaps'



var sourceMapStorageAccountName = substring(replace('${namePrefix}sourcemaps${uniqueString(resourceGroup().id)}', '-', ''), 0, 24)

resource appInsightsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${namePrefix}-insightsWorkspace'
  location: location
}

resource sourceMapStorageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: sourceMapStorageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
  tags: tags
}

resource sourceMapContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${sourceMapStorageAccountName}/default/${sourceMapContainerName}'
  properties: {
    publicAccess: 'None'
  }
  dependsOn: [
    sourceMapStorageAccount
  ]
}

var sourceMapUri = 'https://${sourceMapStorageAccountName}.blob.${environment().suffixes.storage}/${sourceMapContainerName}'

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-applicationInsights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: appInsightsWorkspace.id
  }
  tags: union(tags, {
    'hidden-link:Insights.Sourcemap.Storage': '{"Uri": "${sourceMapUri}"}'
  })
}

@description('This is the built-in Storage Blob Data Contributor role. See https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage')
resource storageBlobDataContributorRoleDefinition 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  scope: subscription()
  name: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
}

// Role assignment for source maps storage account - assign to the deployer
resource sourceMapStorageBlobDataContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid('${namePrefix}-sourcemaps-storage', deployer().objectId, storageBlobDataContributorRoleDefinition.id)
  scope: sourceMapStorageAccount
  properties: {
    roleDefinitionId: storageBlobDataContributorRoleDefinition.id
    principalId: deployer().objectId
    principalType: 'ServicePrincipal'
  }
}

output connectionString string = appInsights.properties.ConnectionString
output appInsightsWorkspaceName string = appInsightsWorkspace.name
output appInsightsId string = appInsights.id
output sourceMapStorageAccountName string = sourceMapStorageAccountName
output sourceMapContainerName string = sourceMapContainerName
