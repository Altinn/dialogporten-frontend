@description('Prefix used to name resources, ensuring unique names across the deployment.')
param namePrefix string

@description('The Azure region where resources will be deployed.')
param location string

@description('The identifier of the subnet where the Application Gateway will be deployed.')
param subnetId string

@description('The name of the existing container app environment to be used.')
param containerAppEnvName string

@description('The name of the existing log analytics workspace to be used.')
param appInsightWorkspaceName string

@description('The tags to apply to the resources')
param tags object

@description('Enable maintenance mode to redirect all traffic to maintenance page')
param enableMaintenancePage bool = false

@export()
type HostNameConfiguration = {
  name: string
  isPrimary: bool
  sslCertificateSecretKey: string
}

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
  hostNames: HostNameConfiguration[]
  sslCertificateKeyVaultName: string
  zones: array?
}
@description('Configuration settings for the Application Gateway, including SKU, hostnames and autoscale parameters.')
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

// Get the primary hostname configuration
var primaryHostName = filter(configuration.hostNames, hostname => hostname.isPrimary)[0]

// Create SSL certificate secret IDs for all hostnames
var sslCertificateSecretIds = [for hostname in configuration.hostNames: {
  name: hostname.name
  secretId: 'https://${configuration.sslCertificateKeyVaultName}${environment().suffixes.keyvaultDns}/secrets/${hostname.sslCertificateSecretKey}'
}]

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
    port: 443
    protocol: 'Https'
    cookieBasedAffinity: 'Disabled'
    pickHostNameFromBackendAddress: false
    hostName: bffPool.properties.backendAddresses[0].fqdn
    requestTimeout: 120
    probe: {
      id: resourceId('Microsoft.Network/applicationGateways/probes', gatewayName, bffProbe.name)
    }
  }
}

var bffProbe = {
  name: '${gatewayName}-bffBackendPool-probe'
  properties: {
    host: bffPool.properties.backendAddresses[0].fqdn
    protocol: 'Https'
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
    protocol: 'Https'
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
    port: 443
    protocol: 'Https'
    cookieBasedAffinity: 'Disabled'
    pickHostNameFromBackendAddress: false
    hostName: frontendPool.properties.backendAddresses[0].fqdn
    requestTimeout: 60
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

var maintenanceHostName = 'dialogportentemp.z1.web.${environment().suffixes.storage}'

var maintenancePool = {
  name: '${gatewayName}-maintenancePool'
  properties: {
    backendAddresses: [
      {
        fqdn: maintenanceHostName
      }
    ]
  }
}

var maintenanceProbe = {
  name: '${gatewayName}-maintenancePool-probe'
  properties: {
    host: maintenanceHostName
    protocol: 'Https'
    path: '/'
    interval: 30
    timeout: 30
    unhealthyThreshold: 3
    pickHostNameFromBackendSettings: false
  }
}

var maintenanceHttpSettings = {
  name: '${gatewayName}-maintenancePool-backendHttpSettings'
  properties: {
    port: 443
    protocol: 'Https'
    cookieBasedAffinity: 'Disabled'
    pickHostNameFromBackendAddress: false
    hostName: maintenanceHostName
    requestTimeout: 60
    probe: {
      id: resourceId('Microsoft.Network/applicationGateways/probes', gatewayName, maintenanceProbe.name)
    }
  }
}

var maintenanceGatewayBackend = {
  pool: maintenancePool
  httpSettings: maintenanceHttpSettings
  probe: maintenanceProbe
}

// Create HTTP listeners for each hostname
var httpsListeners = [for (hostname, i) in configuration.hostNames: {
  name: '${gatewayName}-gatewayHttpListener-443-${replace(hostname.name, '.', '-')}'
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
    hostName: hostname.name
    sslCertificate: {
      id: resourceId(
        'Microsoft.Network/applicationGateways/sslCertificates',
        gatewayName,
        '${gatewayName}-gatewaySslCertificate-${replace(hostname.name, '.', '-')}'
      )
    }
  }
}]

var httpListener = {
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

// Create redirect configurations for non-primary hostnames
var hostnameRedirectConfigurations = [for hostname in filter(configuration.hostNames, h => !h.isPrimary): {
  name: '${gatewayName}-redirect-${replace(hostname.name, '.', '-')}-to-primary'
  properties: {
    redirectType: 'Permanent'
    includePath: true
    includeQueryString: true
    targetUrl: 'https://${primaryHostName.name}'
    requestRoutingRules: [
      {
        id: resourceId(
          'Microsoft.Network/applicationGateways/requestRoutingRules',
          gatewayName,
          '${gatewayName}-redirect-${replace(hostname.name, '.', '-')}-to-primary'
        )
      }
    ]
  }
}]

var httpToHttpsRedirectConfiguration = {
  name: '${gatewayName}-redirectHttpToHttps'
  properties: {
    redirectType: 'Permanent'
    includePath: true
    includeQueryString: true
    targetListener: {
      id: resourceId(
        'Microsoft.Network/applicationGateways/httpListeners',
        gatewayName,
        '${gatewayName}-gatewayHttpListener-443-${replace(primaryHostName.name, '.', '-')}'
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

// Create routing rules for non-primary hostnames
var hostnameRedirectRoutingRules = [for (hostname, i) in filter(configuration.hostNames, h => !h.isPrimary): {
  name: '${gatewayName}-redirect-${replace(hostname.name, '.', '-')}-to-primary'
  properties: {
    priority: 110 + i
    ruleType: 'Basic'
    redirectConfiguration: {
      id: resourceId(
        'Microsoft.Network/applicationGateways/redirectConfigurations',
        gatewayName,
        '${gatewayName}-redirect-${replace(hostname.name, '.', '-')}-to-primary'
      )
    }
    httpListener: {
      id: resourceId(
        'Microsoft.Network/applicationGateways/httpListeners',
        gatewayName,
        '${gatewayName}-gatewayHttpListener-443-${replace(hostname.name, '.', '-')}'
      )
    }
  }
}]

var primaryRoutingRule = {
  name: '${gatewayName}-pathBasedRoutingRule-https-primary'
  properties: {
    priority: 100
    ruleType: 'PathBasedRouting'
    httpListener: {
      id: resourceId(
        'Microsoft.Network/applicationGateways/httpListeners',
        gatewayName,
        '${gatewayName}-gatewayHttpListener-443-${replace(primaryHostName.name, '.', '-')}'
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

var httpToHttpsRoutingRule = {
  name: '${gatewayName}-redirectHttpToHttps'
  properties: {
    priority: 200
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

resource applicationGateway 'Microsoft.Network/applicationGateways@2024-01-01' = {
  name: gatewayName
  location: location
  zones: configuration.?zones
  properties: {
    autoscaleConfiguration: configuration.?autoscaleConfiguration
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
                  id: subnetId
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
    httpListeners: concat(httpsListeners, [httpListener])
    redirectConfigurations: concat([httpToHttpsRedirectConfiguration], hostnameRedirectConfigurations)
    sslCertificates: [for hostname in configuration.hostNames: {
      name: '${gatewayName}-gatewaySslCertificate-${replace(hostname.name, '.', '-')}'
      properties: {
        keyVaultSecretId: filter(sslCertificateSecretIds, cert => cert.name == hostname.name)[0].secretId
      }
    }]
    backendAddressPools: [
      bffGatewayBackend.pool
      frontendGatewayBackend.pool
      maintenanceGatewayBackend.pool
    ]
    backendHttpSettingsCollection: [
      bffGatewayBackend.httpSettings
      frontendGatewayBackend.httpSettings
      maintenanceGatewayBackend.httpSettings
    ]
    probes: [
      bffGatewayBackend.probe
      frontendGatewayBackend.probe
      maintenanceGatewayBackend.probe
    ]
    urlPathMaps: [
      {
        name: '${bffGatewayBackend.pool.name}.pathMap'
        properties: {
          defaultBackendAddressPool: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/backendAddressPools',
              gatewayName,
              enableMaintenancePage ? maintenanceGatewayBackend.pool.name : frontendGatewayBackend.pool.name
            )
          }
          defaultBackendHttpSettings: {
            id: resourceId(
              'Microsoft.Network/applicationGateways/backendHttpSettingsCollection',
              gatewayName,
              enableMaintenancePage ? maintenanceGatewayBackend.httpSettings.name : frontendGatewayBackend.httpSettings.name
            )
          }
          pathRules: enableMaintenancePage ? [] : [
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
    requestRoutingRules: concat([primaryRoutingRule], hostnameRedirectRoutingRules, [httpToHttpsRoutingRule])
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
