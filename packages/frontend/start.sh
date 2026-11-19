#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Render index.html from the template, replacing the placeholders
envsubst '$APPLICATION_INSIGHTS_INSTRUMENTATION_KEY $APPLICATION_INSIGHTS_DISABLE_DEPENDENCY_TRACKING $DIALOGPORTEN_STREAM_URL' < /usr/share/nginx/index.html.template > /usr/share/nginx/html/index.html

# Start Nginx
exec nginx -g 'daemon off;'
