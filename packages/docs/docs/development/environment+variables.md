# Environment variables

This minimalistic style guide is designed to ensure consistency and scalability in our frontend projects.

## Adding New Environment Variables

To add a new environment variable to the project, follow these steps:

1. **Define the Variable in `config.ts`:**
   ```typescript:packages/frontend/src/config.ts
   interface Window {
     applicationInsightsInstrumentationKey: string | undefined;
     dialogportenStreamUrl: string | undefined;
     // Add your new environment variable here
     newEnvVariable: string | undefined;
   }

   declare const window: Window;

   export const config = {
     // Existing environment variables
     applicationInsightsInstrumentationKey: window.applicationInsightsInstrumentationKey,
     dialogportenStreamUrl: window.dialogportenStreamUrl,
     // Add your new environment variable here
     newEnvVariable: window.newEnvVariable,
   };
   ```

2. **Update `index.html` with the New Variable:**
   ```html:packages/frontend/index.html
   <script>
     window.applicationInsightsInstrumentationKey = '$APPLICATION_INSIGHTS_INSTRUMENTATION_KEY';
     window.dialogportenStreamUrl = '$DIALOGPORTEN_STREAM_URL';
     window.newEnvVariable = '$NEW_ENV_VARIABLE';
   </script>
   ```

3. **Modify the `start.sh` Script to Substitute the New Variable:**
   ```shell:packages/frontend/start.sh
   # Replace the placeholders in index.html and create a temporary file
   envsubst '$APPLICATION_INSIGHTS_INSTRUMENTATION_KEY $DIALOGPORTEN_STREAM_URL $NEW_ENV_VARIABLE' < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index_temp.html
   ```

4. **Restart the Application:**
   After making these changes, rebuild and restart your Docker containers to apply the new environment variables.

