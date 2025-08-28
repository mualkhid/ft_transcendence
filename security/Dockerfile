# Use official ModSecurity with Nginx
FROM owasp/modsecurity:nginx

# Install curl and tar for downloading CRS
RUN apt-get update && apt-get install -y curl tar

# Copy Nginx config and SSL certs
COPY ssl/nginx.conf /etc/nginx/nginx.conf
COPY ssl/ /etc/nginx/ssl/

# Copy ModSecurity config and CRS setup
COPY modsecurity/modsecurity.conf /etc/nginx/modsec/modsecurity.conf
COPY modsecurity/crs-setup.conf /etc/nginx/modsec/crs-setup.conf

# Always fetch latest CRS rules (ensures rules exist even if deleted locally)
RUN rm -rf /etc/nginx/modsec/rules && \
    curl -L https://github.com/coreruleset/coreruleset/archive/refs/heads/v4.0/dev.tar.gz | tar xz && \
    mv coreruleset-4.0-dev/rules /etc/nginx/modsec/rules && \
    rm -rf coreruleset-4.0-dev

# Expose HTTP and HTTPS ports
EXPOSE 80 443