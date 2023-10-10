param(
	[Parameter(Mandatory)]
	[string]$environment,

	[Parameter(Mandatory)]
	[string]$subscriptionId,

	[Parameter(Mandatory)]
	[string]$imageUrl
)
Import-module "$PSScriptRoot/powershell/jsonMerge.ps1" -Force
Import-module "$PSScriptRoot/powershell/pwdGenerator.ps1" -Force

# Merge main.parameters.json and optional main.parameters.$environment.json
$paramsJson = JsonMergeFromPath "$PSScriptRoot/main.parameters.json" "$PSScriptRoot/main.parameters.$environment.json"

# Add keyvault keys to parameters.keyVault.value.source.keys
AddMemberPath $paramsJson "parameters.keyVault.value.source.keys" @( `
		az keyvault secret list `
		--vault-name $paramsJson.parameters.keyVault.value.source.name `
		--subscription $paramsJson.parameters.keyVault.value.source.subscriptionId `
		--query "[].name" `
		--output tsv `
)

# Add auto generated secrets to parameters
AddMemberPath $paramsJson "parameters.secrets.value" @{
	dialogportenPgAdminPassword = (GeneratePassword -length 30).Password
}
AddMemberPath $paramsJson "parameters.imageUrl.value" $imageUrl
# AddMemberPath $paramsJson "parameters.imageUrl.value" @{
# 	imageUrl = $imageUrl
# }

# Add environment to parameters
AddMemberPath $paramsJson "parameters.environment.value" $environment

Write-Host (ConvertTo-Json -Depth 100 $paramsJson)

# Format parameters to be used in az deployment sub create
$formatedParamsJson = $paramsJson `
| ConvertTo-Json -Compress -Depth 100 `
| % { $_ -replace "`"", "\`"" } `
| % { $_ -replace "`n", "" } `
| % { $_ -replace "\s", "" }

Write-Host ("********** Starting deployment of $environment **********")
Write-Host ("********** properties $properties **********")
Write-Host ("********** formatedParamsJson $formatedParamsJson **********")

# Deploy
$deploymentOutputs = @( `
		az deployment sub create `
		--debug `
		--verbose `
		--subscription $subscriptionId `
		--location $paramsJson.parameters.location.value `
		--name "GithubActionsDeploy-$environment" `
		--template-file "$($PSScriptRoot)/main.bicep" `
		--parameters $formatedParamsJson `
		--query properties.outputs `
		#--confirm-with-what-if
	| ConvertFrom-Json `
)
Write-Host ("********** deploymentOutputs $deploymentOutputs **********")


Write-Host ("********** Starting foreach **********")

# Write outputs to GITHUB_OUTPUT so that they can be used in other steps
foreach ($Property in $deploymentOutputs | Get-Member -type NoteProperty, Property) {
	"$($Property.Name)=$($deploymentOutputs.$($Property.Name).value)" >> $env:GITHUB_OUTPUT
}