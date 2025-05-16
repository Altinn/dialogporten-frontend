@description('The geographic location where the resource will be deployed')
param location string

@description('The name of the container app environment')
param name string

@description('The identifier for the subnet where the container app environment will be deployed')
param subnetId string = ''

@description('The name of the Application Insights workspace associated with the container app environment')
param appInsightWorkspaceName string

@description('Whether to enable zone redundancy for the container app environment')
param zoneRedundancyEnabled bool = false

@description('The workload profiles for the container app environment')
param workloadProfiles array = []

@description('The tags to apply to the resources')
param tags object

resource appInsightsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  name: appInsightWorkspaceName
}

resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-10-02-preview' = {
  name: name
  location: location
  properties: {
    vnetConfiguration: !empty(subnetId) ? {
      infrastructureSubnetId: subnetId
      internal: true
    } : null
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: appInsightsWorkspace.properties.customerId
        sharedKey: appInsightsWorkspace.listKeys().primarySharedKey
      }
    }
    zoneRedundant: zoneRedundancyEnabled
    availabilityZones: zoneRedundancyEnabled ? [
      '1', '2','3'
    ] : null
    workloadProfiles: workloadProfiles
  }
  tags: tags
}

output name string = containerAppEnv.name
output defaultDomain string = containerAppEnv.properties.defaultDomain
output staticIp string = containerAppEnv.properties.staticIp
