# # Step 1: Use an official Node.js image to build the React app
FROM node:18-alpine 

# # Set the working directory in the container
# WORKDIR /app

# # Copy package.json and package-lock.json to the working directory
COPY /services/client/public /public
COPY /services/client/src /src
COPY /services/client/package*.json /
# # Install dependencies with --legacy-peer-deps
RUN npm install --f