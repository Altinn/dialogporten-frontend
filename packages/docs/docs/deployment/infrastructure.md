# Infrastructure

Infrastructure definitions for the project are located in the `.azure/infrastructure` folder. To add new infrastructure components, follow the existing pattern found within this directory. This involves creating new Bicep files or modifying existing ones to define the necessary infrastructure resources.

For example, to add a new storage account, you would:
- Create or update a Bicep file within the `.azure/infrastructure` folder to include the storage account resource definition.
- Ensure that the Bicep file is referenced correctly in `.azure/infrastructure/infrastructure.bicep` to be included in the deployment process.

Refer to the existing infrastructure definitions as templates for creating new components.

## Deploying a new infrastructure environment

A few resources need to be created before we can apply the Bicep to create the main resources. 

The resources refer to a `source key vault` in order to fetch the necessary secrets and store them in the key vault for the environment. An `ssh`-key is also necessary for the `ssh-jumper` used to access the resources in Azure within the `vnet`. 

Use the following steps:

- Ensure a `source key vault` exist for the new environment. Either create a new key vault or use an existing key vault. Currently, two key vaults exist for our environments. One in the test subscription used by Test, YT01 and Staging, and one in our Production subscription, which Production uses. Ensure you add the necessary secrets that should be used by the new environment. Ensure also that the key vault has the following enabled: `Azure Resource Manager for template deployment`.

- Ensure that a role assignment `Key Vault Secrets User` and `Contributer`(should be inherited) is added for the service principal used by the GitHub Entra Application.

- Create an SSH key in Azure and discard the private key. We will use the `az cli` to access the virtual machine so storing the `ssh key` is only a security risk. 

- Create a new environment in GitHub and add the following secrets: `AZURE_CLIENT_ID`, `AZURE_SOURCE_KEY_VAULT_NAME`, `AZURE_SOURCE_KEY_VAULT_RESOURCE_GROUP`, `AZURE_SOURCE_KEY_VAULT_SUBSCRIPTION_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`, `AZURE_CERTIFICATE_KEY_VAULT_NAME` and `AZURE_SOURCE_KEY_VAULT_SSH_JUMPER_SSH_PUBLIC_KEY`

- Add a new file for the environment `.azure/infrastructure/<env>.bicepparam`. `<env>` must match the environment created in GitHub.

- Add the new environment in the `dispatch-infrastructure.yml` list of environments. 

- Run the GitHub action `Dispatch infrastructure` with the `version` you want to deploy and `environment`. All the resources in `.azure/infrastructure/main.bicep` should now be created. 

- (The GitHub action might need to restart because of a timeout when creating Redis).

## Connecting to resources in Azure

There is a `ssh-jumper` virtual machine deployed with the infrastructure. This can be used to create a `ssh`-tunnel into the `vnet`. Use one of the following methods to gain access to resources within the `vnet`:

Ensure you log into the azure CLI using the relevant user and subscription using `az login`.

- Connect to the VNet using the following command:
   ```
   az ssh vm --resource-group dp-fe-<env>-rg --vm-name dp-fe-<env>-ssh-jumper
   ```
   (You may be prompted to install the ssh extension for the azure cli)

- To create an SSH tunnel for accessing specific resources (e.g., PostgreSQL database), use:
   ```
   az ssh vm -g dp-fe-<env>-rg -n dp-fe-<env>-ssh-jumper -- -L 5432:<database-host-name>:5432
   ```
   This example forwards the PostgreSQL default port (5432) to your localhost. Adjust the ports and hostnames as needed for other resources.

- Alternatively, you can use the database-forwarder utility located in `scripts/database-forwarder/` for an easier way to connect to PostgreSQL and Redis:
   ```bash
   # Interactive mode
   ./scripts/database-forwarder/forward.sh

   # Or specify environment and database type directly
   ./scripts/database-forwarder/forward.sh -e test -t postgres
   ./scripts/database-forwarder/forward.sh -e prod -t redis
   ```
   This utility provides a more user-friendly way to establish connections and will show you the relevant connection details. See the utility's README for more detailed instructions.