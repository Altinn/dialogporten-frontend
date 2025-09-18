param location string
param name string
param image string
param containerAppEnvId string
param port int = 8080
param environmentVariables { name: string, value: string?, secretRef: string? }[] = []
param probes { periodSeconds: int, initialDelaySeconds: int, type: string, httpGet: { path: string, port: int } }[] = []
param minReplicas int = 1
param maxReplicas int = 3
@description('The tags to apply to the resources')
param tags object
param secrets { name: string, keyVaultUrl: string, identity: 'System' }[] = []
@description('The workload profile name to use, defaults to "Consumption"')
param workloadProfileName string = 'Consumption'
@description('CPU and memory resources for the container app')
param resources object?

var healthProbes = empty(probes)
  ? [
      {
        periodSeconds: 5
        initialDelaySeconds: 2
        type: 'Liveness'
        httpGet: {
          path: '/api/liveness'
          port: port
        }
      }
      {
        periodSeconds: 5
        initialDelaySeconds: 2
        type: 'Readiness'
        httpGet: {
          path: '/api/readiness'
          port: port
        }
      }
    ]
  : probes

var ingress = {
  targetPort: port
  external: true
  allowInsecure: false
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  properties: {
    environmentId: containerAppEnvId
    configuration: {
      secrets: secrets
      activeRevisionsMode: 'Single'
      ingress: ingress
    }
    workloadProfileName: workloadProfileName
    template: {
      containers: [
        {
          name: name
          image: image
          env: environmentVariables
          probes: healthProbes
          resources: resources
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
}

output identityPrincipalId string = containerApp.identity.principalId
output name string = containerApp.name
output revisionName string = containerApp.properties.latestRevisionName
