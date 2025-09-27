# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the built application
COPY dist/ ./dist/

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the application
CMD ["node", "dist/index.js"]
