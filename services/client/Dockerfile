# # Step 1: Use an official Node.js image to build the React app
FROM node:18-alpine AS build

# # Set the working directory in the container
WORKDIR /app

# # Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install --legacy-peer-deps

# Copy source files
COPY public ./public
COPY src ./src

# Optional: Silence outdated Browserslist warning
RUN npx update-browserslist-db@latest || true

# Build the app
RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:alpine

# Copy custom NGINX config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy runtime env injector
COPY entrypoint.sh /entrypoint.sh
COPY public/env.template.js /usr/share/nginx/html/env.template.js

RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]