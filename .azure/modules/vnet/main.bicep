@description('The prefix used for naming resources to ensure unique names')
param namePrefix string

@description('The location where the resources will be deployed')
param location string

@description('The tags to apply to the resources')
param tags object

@description('Optional list of IP addresses/ranges to whitelist for incoming traffic')
param applicationGatewayWhitelistedIps array = []

// Network address ranges
var vnetAddressPrefix = '10.0.0.0/16'

// Subnet address ranges
var defaultSubnetAddressPrefix = '10.0.0.0/24'
var applicationGatewaySubnetAddressPrefix = '10.0.1.0/24'
var containerAppEnvSubnetAddressPrefix = '10.0.2.0/23'
var postgresqlSubnetAddressPrefix = '10.0.4.0/24'
var redisSubnetAddressPrefix = '10.0.5.0/24'
var sshJumperSubnetAddressPrefix = '10.0.6.0/24'

var commonHttpProperties = {
  protocol: '*'
  sourcePortRange: '*'
  destinationAddressPrefix: '*'
  direction: 'Inbound'
  sourcePortRanges: []
  destinationPortRanges: ['80', '443']
  sourceAddressPrefixes: []
  destinationAddressPrefixes: []
}

var allowAllHttpRule = {
  name: 'AllowAnyIncomingHttpTraffic'
  type: 'Microsoft.Network/networkSecurityGroups/securityRules'
  properties: union(commonHttpProperties, {
    sourceAddressPrefix: '*'
    access: 'Allow'
    priority: 110
  })
}

var whitelistedHttpRule = {
  name: 'AllowWhitelistedIncomingHttpTraffic'
  type: 'Microsoft.Network/networkSecurityGroups/securityRules'
  properties: union(commonHttpProperties, {
    sourceAddressPrefixes: applicationGatewayWhitelistedIps
    access: 'Allow'
    priority: 110
  })
}

var denyOtherHttpRule = {
  name: 'DenyAllOtherIncomingHttpTraffic'
  type: 'Microsoft.Network/networkSecurityGroups/securityRules'
  properties: union(commonHttpProperties, {
    sourceAddressPrefix: '*'
    access: 'Deny'
    priority: 120
  })
}

var applicationGatewayNSGHttpRules = empty(applicationGatewayWhitelistedIps) ? [
  allowAllHttpRule
] : [
  whitelistedHttpRule
  denyOtherHttpRule
]

// https://learn.microsoft.com/en-us/azure/application-gateway/configuration-infrastructure
resource applicationGatewayNSG 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${namePrefix}-application-gateway-nsg'
  location: location
  properties: {
    securityRules: concat(
      [{
        name: 'AllowAnyCustom65200-65535Inbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '65200-65535'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Inbound'
          sourcePortRanges: []
          destinationPortRanges: []
          sourceAddressPrefixes: []
          destinationAddressPrefixes: []
        }
      }],
      applicationGatewayNSGHttpRules
    )
  }
  tags: tags
}

resource defaultNSG 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${namePrefix}-default-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowAnyCustomAnyInbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowAnyCustomAnyOutbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Outbound'
        }
      }
    ]
  }
  tags: tags
}

// https://learn.microsoft.com/en-us/azure/container-apps/firewall-integration?tabs=consumption-only
resource containerAppEnvironmentNSG 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${namePrefix}-container-app-environment-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowAnyCustomAnyOutbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 110
          direction: 'Outbound'
          sourcePortRanges: []
          destinationPortRanges: []
          sourceAddressPrefixes: []
          destinationAddressPrefixes: []
        }
      }
      {
        name: 'container-app'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 120
          direction: 'Inbound'
          sourcePortRanges: []
          destinationPortRanges: ['80', '443']
          sourceAddressPrefixes: []
          destinationAddressPrefixes: []
        }
      }
      {
        name: 'container-app-environment'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '10.0.0.62'
          access: 'Allow'
          priority: 130
          direction: 'Inbound'
          sourcePortRanges: []
          destinationPortRanges: ['80', '443']
          sourceAddressPrefixes: []
          destinationAddressPrefixes: []
        }
      }
      {
        name: 'load-balancer'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '30000-32767'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 140
          direction: 'Inbound'
          sourcePortRanges: []
          destinationPortRanges: []
          sourceAddressPrefixes: []
          destinationAddressPrefixes: []
        }
      }
      // remove once we want a more fine grained control over the ports
      {
        name: 'AllowAnyCustomAnyInbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 150
          direction: 'Inbound'
          sourcePortRanges: []
          destinationPortRanges: []
          sourceAddressPrefixes: []
          destinationAddressPrefixes: []
        }
      }
    ]
  }
  tags: tags
}

resource postgresqlNSG 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${namePrefix}-postgresql-nsg'
  location: location
  properties: {
    securityRules: [
      // todo: restrict the ports furter: https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-networking-private#virtual-network-concepts
      {
        name: 'AllowAnyCustomAnyInbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowAnyCustomAnyOutbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Outbound'
        }
      }
    ]
  }
  tags: tags
}

resource redisNSG 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${namePrefix}-redis-nsg'
  location: location
  properties: {
    securityRules: [
      // todo: restrict the ports furter: https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-networking-private#virtual-network-concepts
      {
        name: 'AllowAnyCustomAnyInbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowAnyCustomAnyOutbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Outbound'
        }
      }
    ]
  }
  tags: tags
}

resource sshJumperNSG 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${namePrefix}-ssh-jumper-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowAnyCustomAnyOutbound'
        type: 'Microsoft.Network/networkSecurityGroups/securityRules'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 100
          direction: 'Outbound'
        }
      }
    ]
  }
  tags: tags
}

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: '${namePrefix}-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: defaultSubnetAddressPrefix
          networkSecurityGroup: {
            id: defaultNSG.id
          }
        }
      }
      {
        name: 'applicationGatewaySubnet'
        properties: {
          addressPrefix: applicationGatewaySubnetAddressPrefix
          networkSecurityGroup: {
            id: applicationGatewayNSG.id
          }
        }
      }
      {
        name: 'containerAppEnvSubnet'
        properties: {
          // required size for the container app environment is /23
          addressPrefix: containerAppEnvSubnetAddressPrefix
          networkSecurityGroup: {
            id: containerAppEnvironmentNSG.id
          }
          privateLinkServiceNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'postgresqlSubnet'
        properties: {
          addressPrefix: postgresqlSubnetAddressPrefix
          networkSecurityGroup: {
            id: postgresqlNSG.id
          }
          delegations: [
            {
              name: 'postgresql'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
              locations: [location]
            }
          ]
        }
      }
      {
        name: 'redisSubnet'
        properties: {
          addressPrefix: redisSubnetAddressPrefix
          networkSecurityGroup: {
            id: redisNSG.id
          }
        }
      }
      {
        name: 'sshJumperSubnet'
        properties: {
          addressPrefix: sshJumperSubnetAddressPrefix
          networkSecurityGroup: {
            id: sshJumperNSG.id
          }
        }
      }
    ]
  }
  tags: tags
}

output virtualNetworkName string = virtualNetwork.name
output virtualNetworkId string = virtualNetwork.id
output defaultSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, 'default')
output applicationGatewaySubnetId string = resourceId(
  'Microsoft.Network/virtualNetworks/subnets',
  virtualNetwork.name,
  'applicationGatewaySubnet'
)
output containerAppEnvironmentSubnetId string = resourceId(
  'Microsoft.Network/virtualNetworks/subnets',
  virtualNetwork.name,
  'containerAppEnvSubnet'
)
output postgresqlSubnetId string = resourceId(
  'Microsoft.Network/virtualNetworks/subnets',
  virtualNetwork.name,
  'postgresqlSubnet'
)
output redisSubnetId string = resourceId(
  'Microsoft.Network/virtualNetworks/subnets',
  virtualNetwork.name,
  'redisSubnet'
)
output sshJumperSubnetId string = resourceId(
  'Microsoft.Network/virtualNetworks/subnets',
  virtualNetwork.name,
  'sshJumperSubnet'
)
