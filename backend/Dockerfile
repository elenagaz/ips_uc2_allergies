# Use official Node.js image from DockerHub
FROM node:16

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the backend server port (e.g., 3000 for Express)
EXPOSE 3000

# Run the server
CMD ["npm", "start"]
