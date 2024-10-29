# Step 1: Use an official Node image as a build environment
FROM node:16 AS build

WORKDIR /app

# Copy the package.json and package-lock.json files to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application for production
RUN npm run build

# Step 2: Use an official Nginx image to serve the built app
FROM nginx:alpine

# Copy the built app from the build stage to the Nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 to make the app accessible externally
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
