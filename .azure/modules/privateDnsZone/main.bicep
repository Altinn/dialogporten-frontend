@description('Prefix used for naming resources to ensure unique names')
param namePrefix string

@description('The default domain for the private DNS zone')
param defaultDomain string

@description('The ID of the virtual network linked to the private DNS zone')
param vnetId string

type ARecord = {
  name: string
  ip: string
  ttl: int
}
@description('Array of A records to be created in the DNS zone')
param aRecords ARecord[] = []

@description('The tags to apply to the resources')
param tags object

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: defaultDomain
  location: 'global'
  properties: {}
}

resource aRecordResources 'Microsoft.Network/privateDnsZones/A@2024-06-01' = [
  for record in aRecords: {
    parent: privateDnsZone
    name: record.name
    properties: {
      ttl: record.ttl
      aRecords: [
        {
          ipv4Address: record.ip
        }
      ]
    }
  }
]

resource virtualNetworkLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: '${namePrefix}-pdns-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
  tags: tags
}

output id string = privateDnsZone.id
