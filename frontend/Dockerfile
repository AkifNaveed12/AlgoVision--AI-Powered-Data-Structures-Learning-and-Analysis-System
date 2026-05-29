# Stage 1: Build the React/Vite application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend files
COPY . .

# Build the app for production (this creates the 'dist' folder)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output from Stage 1 to Nginx HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy your custom Nginx config (we will use default if you don't have a complex one)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]