#!/bin/sh

# Replace variables in env.template.js with real env values
envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

# Start NGINX
exec nginx -g 'daemon off;'