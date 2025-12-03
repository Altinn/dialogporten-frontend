using './main.bicep'

param environment = 'staging'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param minReplicas = 2
param maxReplicas = 3
param workloadProfileName = 'Consumption'

// secrets
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param applicationInsightsInstrumentationKey = readEnvironmentVariable('AZURE_APPLICATION_INSIGHTS_INSTRUMENTATION_KEY')

// environment variables
param dialogportenStreamUrl = 'https://altinn-tt02-api.azure-api.net/dialogporten/graphql/stream'
