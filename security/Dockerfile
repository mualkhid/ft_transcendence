
FROM nginx

# Install curl and tar for downloading CRS
RUN apt-get update && apt-get install -y curl tar

# Copy Nginx config and SSL certs
COPY ssl/nginx.conf /etc/nginx/nginx.conf
COPY ssl/ /etc/nginx/ssl/

# Expose HTTP and HTTPS ports
EXPOSE 80 443
