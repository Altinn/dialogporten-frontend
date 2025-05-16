targetScope = 'resourceGroup'

@minLength(3)
param imageTag string
@minLength(3)
param environment string
@minLength(3)
param location string
param port int = 80
param minReplicas int
param maxReplicas int

@minLength(3)
@secure()
param containerAppEnvironmentName string

@secure()
param applicationInsightsInstrumentationKey string

@description('The workload profile name to use, defaults to "Consumption"')
param workloadProfileName string = 'Consumption'

var namePrefix = 'dp-fe-${environment}'
var baseImageUrl = 'ghcr.io/altinn/dialogporten-frontend-'
var serviceName = 'frontend'
var containerAppName = '${namePrefix}-${serviceName}'
var tags = {
  Environment: environment
  Product: 'Arbeidsflate'
}

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerAppEnvironmentName
}

var environmentVariables = [
  {
    name: 'NODE_ENV'
    value: 'production'
  }
  {
    name: 'APPLICATION_INSIGHTS_INSTRUMENTATION_KEY'
    value: applicationInsightsInstrumentationKey
  }
]

var healthProbes = [
  {
    periodSeconds: 5
    initialDelaySeconds: 2
    type: 'Liveness'
    httpGet: {
      path: '/'
      port: port
    }
  }
  {
    periodSeconds: 5
    initialDelaySeconds: 2
    type: 'Readiness'
    httpGet: {
      path: '/'
      port: port
    }
  }
]

module containerApp '../../modules/containerApp/main.bicep' = {
  name: containerAppName
  params: {
    name: containerAppName
    location: location
    image: '${baseImageUrl}${serviceName}:${imageTag}'
    containerAppEnvId: containerAppEnvironment.id
    probes: healthProbes
    port: port
    minReplicas: minReplicas
    maxReplicas: maxReplicas
    tags: tags
    environmentVariables: environmentVariables
    workloadProfileName: workloadProfileName
  }
}

output name string = containerApp.outputs.name
output revisionName string = containerApp.outputs.revisionName
