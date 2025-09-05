# Create SSL directory
mkdir -p security/ssl

# Generate self-signed certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /workspaces/ft_transcendence/security/ssl/server.key \
  -out /workspaces/ft_transcendence/security/ssl/server.crt \
  -subj "/CN=localhost" \
  -addext "subjectAltName=IP:127.0.0.1"
