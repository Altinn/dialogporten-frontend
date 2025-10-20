@description('The prefix used for naming resources to ensure unique names')
param namePrefix string

@description('The location where the resources will be deployed')
param location string

@description('Tags to apply to resources')
param tags object

@export()
type Sku = {
  name: 'Free' | 'Standard'
}

@description('The SKU of the App Configuration store')
param sku Sku = { name: 'Standard' }

@description('Whether to disable local authentication (use Entra ID only)')
param disableLocalAuth bool = false

@description('Number of days to retain soft-deleted configuration stores')
@minValue(1)
@maxValue(7)
param softDeleteRetentionInDays int = 7

@description('Whether to enable purge protection')
param enablePurgeProtection bool = false

resource appConfiguration 'Microsoft.AppConfiguration/configurationStores@2025-02-01-preview' = {
  name: '${namePrefix}-appConfiguration'
  location: location
  sku: sku
  properties: {
    disableLocalAuth: disableLocalAuth
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enablePurgeProtection: enablePurgeProtection
    dataPlaneProxy: {
      authenticationMode: 'Local'
      privateLinkDelegation: 'Disabled'
    }
  }
  tags: tags
}

output name string = appConfiguration.name
output endpoint string = appConfiguration.properties.endpoint
