using './main.bicep'

param environment = 'test'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param minReplicas = 2
param maxReplicas = 3
param workloadProfileName = 'Consumption'

// secrets
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param applicationInsightsInstrumentationKey = readEnvironmentVariable('AZURE_APPLICATION_INSIGHTS_INSTRUMENTATION_KEY')

// environment variables
param dialogportenStreamUrl = 'https://platform.at23.altinn.cloud/dialogporten/graphql/stream'
