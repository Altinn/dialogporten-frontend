using './main.bicep'

param environment = 'yt01'
param location = 'norwayeast'
param imageTag = readEnvironmentVariable('IMAGE_TAG')
param minReplicas = 2
param maxReplicas = 15
param workloadProfileName = 'Dedicated-D4'

// secrets
param containerAppEnvironmentName = readEnvironmentVariable('CONTAINER_APP_ENVIRONMENT_NAME')
param applicationInsightsInstrumentationKey = readEnvironmentVariable('AZURE_APPLICATION_INSIGHTS_INSTRUMENTATION_KEY')

// environment variables
param dialogportenStreamUrl = 'https://platform.yt01.altinn.cloud/dialogporten/graphql/stream'
param applicationInsightsDisableDependencyTracking = readEnvironmentVariable('APPLICATION_INSIGHTS_DISABLE_DEPENDENCY_TRACKING', 'false')
