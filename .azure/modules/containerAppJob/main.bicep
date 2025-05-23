param location string
param name string
param image string
param containerAppEnvId string
param port int = 8080
param environmentVariables { name: string, value: string?, secretRef: string? }[] = []
param command string[]
@description('The tags to apply to the resources')
param tags object

param secrets { name: string, keyVaultUrl: string, identity: 'system' }[] = []
@description('The workload profile name to use, defaults to "Consumption"')
param workloadProfileName string = 'Consumption'

var probes = [
  {
    periodSeconds: 5
    initialDelaySeconds: 2
    type: 'Liveness'
    httpGet: {
      path: '/liveness'
      port: port
    }
  }
  {
    periodSeconds: 5
    initialDelaySeconds: 2
    type: 'Readiness'
    httpGet: {
      path: '/readiness'
      port: port
    }
  }
]

resource containerAppJob 'Microsoft.App/jobs@2024-03-01' = {
  name: name
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    configuration: {
      secrets: secrets
      replicaRetryLimit: 1
      replicaTimeout: 120
      triggerType: 'Manual'
      manualTriggerConfig: {
        parallelism: 1
        replicaCompletionCount: 1
      }
    }
    environmentId: containerAppEnvId
    template: {
      containers: [
        {
          name: name
          image: image
          env: environmentVariables
          probes: probes
          command: command
        }
      ]
      workloadProfileName: workloadProfileName
    }
  }
  tags: tags
}

output identityPrincipalId string = containerAppJob.identity.principalId
output name string = containerAppJob.name
