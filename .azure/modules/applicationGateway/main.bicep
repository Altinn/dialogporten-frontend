@description('Prefix used to name resources, ensuring unique names across the deployment.')
param namePrefix string

@description('The Azure region where resources will be deployed.')
param location string

@description('The identifier of the subnet where the Application Gateway will be deployed.')
param subnetId string

@description('The identifier of the subnet where the Application Gateway will route requests.')
param targetSubnetId string

@description('The name of the existing container app environment to be used.')
param containerAppEnvName string

@description('The name of the existing log analytics workspace to be used.')
param appInsightWorkspaceName string

@description('The tags to apply to the resources')
param tags object

@export()
type Configuration = {
  sku: {
    name: 'Standard_v2' | 'WAF_v2'
    tier: 'Standard_v2' | 'WAF_v2'
    capacity: int?
  }
  autoscaleConfiguration: {
    minCapacity: int
    maxCapacity: int
  }?
  hostName: string
  sslCertificate: {
    @secure()
    keyVaultName: string
    secretKey: string
  }
}
@description('Configuration settings for the Application Gateway, including SKU, hostname and autoscale parameters.')
param configuration Configuration

var gatewayName = '${namePrefix}-applicationGateway'

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerAppEnvName
}

resource appInsightsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: appInsightWorkspaceName
}

resource publicIp 'Microsoft.Network/publicIPAddresses@2021-03-01' = {
  name: '${gatewayName}-publicIp'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAddressVersion: 'IPv4'
    publicIPAllocationMethod: 'Static'
    idleTimeoutInMinutes: 4
  }
  tags: tags
}

resource applicationGatewayAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${gatewayName}-identity'
  location: location
  tags: tags
}

var publicIpAddressId = publicIp.id

var sslCertificateSecretId = 'https://${configuration.sslCertificate.keyVaultName}${environment().suffixes.keyvaultDns}/secrets/${configuration.sslCertificate.secretKey}'

var bffPool = {
  name: '${gatewayName}-bffBackendPool'
  properties: {
    backendAddresses: [
      {
        fqdn: '${namePrefix}-bff.${containerAppEnvironment.properties.defaultDomain}'
      }
    ]
  }
}

var bffHttpSettings = {
  name: '${gatewayName}-bffBackendPool-backendHttpSettings'
  properties: {
    port: 80
    protocol: 'Http'
    cookieBasedAffinity: 'Disabled'
    pickHostNameFromBackendAddress: false
    hostName: bffPool.properties.backendAddresses[0].fqdn
    requestTimeout: 600
    probe: {
      id: resourceId('Microsoft.Network/applicationGateways/probes', gatewayName, bffProbe.name)
    }
  }
}

var bffProbe = {
  name: '${gatewayName}-bffBackendPool-probe'
  properties: {
    host: bffPool.properties.backendAddresses[0].fqdn
    protocol: 'Http'
    path: '/api/liveness'
    interval: 30
    timeout: 30
    unhealthyThreshold: 3
    pickHostNameFromBackendSettings: false
  }
}

var bffGatewayBackend = {
  pool: bffPool
  httpSettings: bffHttpSettings
  probe: bffProbe
}

var frontendPool = {
  name: '${gatewayName}-frontendPool'
  properties: {
    backendAddresses: [
      {
        fqdn: '${namePrefix}-frontend.${containerAppEnvironment.properties.defaultDomain}'
      }
    ]
  }
}

var frontendProbe = {
  name: '${gatewayName}-frontendPool-probe'
  properties: {
    host: frontendPool.properties.backendAddresses[0].fqdn
    protocol: 'Http'
    path: '/'
    interval: 30
    timeout: 30
    unhealthyThreshold: 3
    pickHostNameFromBackendSettings: false
  }
}

var frontendHttpSettings = {
  name: '${gatewayName}-frontendPool-backendHttpSettings'
  properties: {
    port: 80
    protocol: 'Http'
    cookieBasedAffinity: 'Disabled'
    pickHostNameFromBackendAddress: false
    hostName: frontendPool.properties.backendAddresses[0].fqdn
    requestTimeout: 600
    probe: {
      id: resourceId('Microsoft.Network/applicationGateways/probes', gatewayName, frontendProbe.name)
    }
  }
}

var frontendGatewayBackend = {
  pool: frontendPool
  httpSettings: frontendHttpSettings
  probe: frontendProbe
}

resource applicationGateway 'Microsoft.Network/applicationGateways@2024-01-01' = {
  name: gatewayName
  location: location
  properties: {
    autoscaleConfiguration: configuration.autoscaleConfiguration
    enableHttp2: true
    sku: configuration.sku
    gatewayIPConfigurations: [
      {
        name: '${gatewayName}-gatewayIpConfig'
        properties: {
          subnet: {
            id: subnetId
          }
        }
      }
    ]
    privateLinkConfigurations: [
      {
        name: '${gatewayName}-plc'
        properties: {
          ipConfigurations: [
            {
              name: 'default'
              properties: {
                primary: true
                privateIPAllocationMethod: 'Dynamic'
                subnet: {
                  id: targetSubnetId
                }
              }
            }
          ]
        }
      }
    ]
    frontendIPConfigurations: [
      {
        name: '${gatewayName}-gatewayFrontendIp'
        properties: {
          publicIPAddress: {
            id: publicIpAddressId
          }
          privateIPAllocationMethod: 'Dynamic'
          privateLinkConfiguration: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/privateLinkConfigurations',
              gatewayName,
              '${gatewayName}-plc'
            )
          }
        }
      }
    ]
    frontendPorts: [
      {
        name: '${gatewayName}-gatewayFrontendPort-443'
        properties: {
          port: 443
        }
      }
      {
        name: '${gatewayName}-gatewayFrontendPort-80'
        properties: {
          port: 80
        }
      }
    ]
    httpListeners: [
      {
        name: '${gatewayName}-gatewayHttpListener-443'
        properties: {
          frontendIPConfiguration: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/frontendIPConfigurations',
              gatewayName,
              '${gatewayName}-gatewayFrontendIp'
            )
          }
          frontendPort: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/frontendPorts',
              gatewayName,
              '${gatewayName}-gatewayFrontendPort-443'
            )
          }
          requireServerNameIndication: false
          protocol: 'Https'
          hostName: configuration.hostName
          sslCertificate: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/sslCertificates',
              gatewayName,
              '${gatewayName}-gatewaySslCertificate'
            )
          }
        }
      }
      {
        name: '${gatewayName}-gatewayHttpListener-80'
        properties: {
          frontendIPConfiguration: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/frontendIPConfigurations',
              gatewayName,
              '${gatewayName}-gatewayFrontendIp'
            )
          }
          frontendPort: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/frontendPorts',
              gatewayName,
              '${gatewayName}-gatewayFrontendPort-80'
            )
          }
          requireServerNameIndication: false
          protocol: 'Http'
        }
      }
    ]
    redirectConfigurations: [
      {
        name: '${gatewayName}-redirectHttpToHttps'
        properties: {
          redirectType: 'Permanent'
          includePath: true
          includeQueryString: true
          targetListener: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/httpListeners',
              gatewayName,
              '${gatewayName}-gatewayHttpListener-443'
            )
          }
          requestRoutingRules: [
            {
              id: resourceId(
                'Microsoft.Network/applicationGateways/requestRoutingRules',
                gatewayName,
                '${gatewayName}-redirectHttpToHttps'
              )
            }
          ]
        }
      }
    ]
    sslCertificates: [
      {
        name: '${gatewayName}-gatewaySslCertificate'
        properties: {
          keyVaultSecretId: sslCertificateSecretId
        }
      }
    ]
    backendAddressPools: [
      bffGatewayBackend.pool
      frontendGatewayBackend.pool
    ]
    backendHttpSettingsCollection: [
      bffGatewayBackend.httpSettings
      frontendGatewayBackend.httpSettings
    ]
    probes: [
      bffGatewayBackend.probe
      frontendGatewayBackend.probe
    ]
    urlPathMaps: [
      {
        name: '${bffGatewayBackend.pool.name}.pathMap'
        properties: {
          defaultBackendAddressPool: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/backendAddressPools',
              gatewayName,
              frontendGatewayBackend.pool.name
            )
          }
          defaultBackendHttpSettings: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/backendHttpSettingsCollection',
              gatewayName,
              frontendGatewayBackend.httpSettings.name
            )
          }
          pathRules: [
            {
              name: bffGatewayBackend.pool.name
              properties: {
                paths: [
                  '/api*'
                ]
                backendAddressPool: {
                  id: resourceId(
                    'Microsoft.Network/applicationGateways/backendAddressPools',
                    gatewayName,
                    bffGatewayBackend.pool.name
                  )
                }
                backendHttpSettings: {
                  id: resourceId(
                    'Microsoft.Network/applicationGateways/backendHttpSettingsCollection',
                    gatewayName,
                    bffGatewayBackend.httpSettings.name
                  )
                }
              }
            }
          ]
        }
      }
    ]
    requestRoutingRules: [
      {
        name: '${gatewayName}-pathBasedRoutingRule-https'
        properties: {
          priority: 100
          ruleType: 'PathBasedRouting'
          httpListener: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/httpListeners',
              gatewayName,
              '${gatewayName}-gatewayHttpListener-443'
            )
          }
          urlPathMap: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/urlPathMaps',
              gatewayName,
              '${bffGatewayBackend.pool.name}.pathMap'
            )
          }
        }
      }
      {
        name: '${gatewayName}-pathBasedRoutingRule-http'
        properties: {
          priority: 110
          ruleType: 'Basic'
          redirectConfiguration: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/redirectConfigurations',
              gatewayName,
              '${gatewayName}-redirectHttpToHttps'
            )
          }
          httpListener: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/httpListeners',
              gatewayName,
              '${gatewayName}-gatewayHttpListener-80'
            )
          }
        }
      }
    ]
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${applicationGatewayAssignedIdentity.id}': {}
    }
  }
  tags: tags
}

// todo: setting as 0 for now. Will use the log analytics workspace policy instead. Consider setting explicitly in the future.
var diagnosticSettingRetentionPolicy = {
  days: 0
  enabled: false
}

var diagnosticLogCategories = [
  'ApplicationGatewayAccessLog'
  'ApplicationGatewayPerformanceLog'
]

resource diagnosticSetting 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'ApplicationGatewayDiagnosticSetting'
  scope: applicationGateway
  properties: {
    workspaceId: appInsightsWorkspace.id
    logs: [for category in diagnosticLogCategories: {
      category: category
      enabled: true
      retentionPolicy: diagnosticSettingRetentionPolicy
    }]
  }
}


output applicationGatewayId string = applicationGateway.id
