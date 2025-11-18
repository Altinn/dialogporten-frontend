#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Replace the placeholder in index.html and create a temporary file
envsubst '$APPLICATION_INSIGHTS_INSTRUMENTATION_KEY' < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index_temp.html

# Replace the original index.html with the temporary file
mv /usr/share/nginx/html/index_temp.html /usr/share/nginx/html/index.html

# Start Nginx
# Note: server_tokens off in nginx.conf hides the nginx version from Server header
exec nginx -g 'daemon off;'