# Create SSL directory
mkdir -p security/ssl

# Generate self-signed certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout security/ssl/server.key \
  -out security/ssl/server.crt \
  -subj "/C=AE/ST=Dubai/L=Dubai/O=42AbuDhabi/CN=localhost"