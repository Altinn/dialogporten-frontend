@description('Returns merged FinOps tags for the provided environment')
@export()
func baseTags(existingTags object, environment string) object => union(existingTags, {
  finops_environment: finopsEnvironment(environment)
  finops_product: 'Arbeidsflate'
  Environment: environment
  Product: 'Arbeidsflate'
  repository: 'https://github.com/Altinn/dialogporten-frontend'
})

@description('Maps deployment environment to FinOps environment')
@export()
func finopsEnvironment(environment string) string => environment == 'test'
  ? 'dev'
  : (environment == 'staging'
    ? 'test'
    : (environment == 'yt01'
      ? 'test'
      : (environment == 'prod'
        ? 'prod'
        : environment)))
