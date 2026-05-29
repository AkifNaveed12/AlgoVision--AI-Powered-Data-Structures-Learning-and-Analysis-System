# Use a lightweight universal base image
FROM alpine:latest

# Set the working directory inside the container
WORKDIR /app

# Copy all project files into the image
COPY . .

# A simple command to verify it runs
CMD ["echo", "AlgoVision Image Built Successfully!"]
