# Base image for Node.js applications
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the port your app runs on (e.g., 3000)
EXPOSE 3000

# Command to start the application
CMD ["npm", "start"]