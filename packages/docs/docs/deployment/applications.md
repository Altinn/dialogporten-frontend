# Applications

All application Bicep definitions are located in the `.azure/applications` folder. To add a new application, follow the existing pattern found within this directory. This involves creating a new folder for your application under `.azure/applications` and adding the necessary Bicep files (`main.bicep` and environment-specific parameter files, e.g., `test.bicepparam`, `staging.bicepparam`).

For example, to add a new application named `bff-new`, you would:
- Create a new folder: `.azure/applications/bff-new`
- Add a `main.bicep` file within this folder to define the application's infrastructure.
- Use the appropriate `Bicep`-modules within this file. There is one for `Container apps` which you most likely would use.
- Add parameter files for each environment (e.g., `test.bicepparam`, `staging.bicepparam`) to specify environment-specific values.

Refer to the existing applications like `bff` and `frontend` as templates.

## Deploying applications in a new infrastructure environment

Ensure you have followed the steps in [Deploying a new infrastructure environment](./infrastructure.md) to have the resources required for the applications.

Use the following steps:

- From the infrastructure resources created, add the following GitHub secrets in the new environment (this will not be necessary in the future as secrets would be added directly from infrastructure deployment): `AZURE_APP_INSIGHTS_CONNECTION_STRING`, `AZURE_CONTAINER_APP_ENVIRONMENT_NAME`, `AZURE_ENVIRONMENT_KEY_VAULT_NAME`, and `AZURE_RESOURCE_GROUP_NAME`

- Add new parameter files for the environment in all applications `.azure/applications/*/<env>.bicepparam`

- Run the GitHub action `Dispatch applications` in order to deploy all applications to the new environment.

- Contact Platform team to add an A-record that points to the `Application Gateway` public IP