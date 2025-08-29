
# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN adduser -D -s /bin/sh appuser

# Copy only package files and prisma schema for dependency install and codegen
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install --production && npx prisma generate

# Copy rest of the application code (excluding node_modules)
COPY . .

# Ensure data directory exists and is owned by appuser
RUN mkdir -p /app/data && chown -R appuser:appuser /app

# Use non-root user
USER appuser

# Expose backend port
EXPOSE 3000

# Start the backend
CMD ["node", "server.js"]

