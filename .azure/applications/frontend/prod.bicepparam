using './main.bicep'

param environment = 'prod'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param minReplicas = 2
param maxReplicas = 15
param workloadProfileName = 'Dedicated-D4'

// secrets
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param applicationInsightsInstrumentationKey = readEnvironmentVariable('AZURE_APPLICATION_INSIGHTS_INSTRUMENTATION_KEY')

// environment variables
param dialogportenStreamUrl = 'https://altinn-prod-api.azure-api.net/dialogporten/graphql/stream'
