FROM node:20-slim

# Install OpenSSL and other dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system appuser && adduser --system --ingroup appuser appuser

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Create SQLite data directory and set ownership
RUN mkdir -p /app/data && chown -R appuser:appuser /app

# Copy entrypoint and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER appuser
EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
