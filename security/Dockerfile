FROM owasp/modsecurity:nginx

# Copy Nginx config
COPY ssl/nginx.conf /etc/nginx/nginx.conf

# Copy SSL certificates and keys (make sure these exist)
COPY ssl/ /etc/nginx/ssl/

# Copy ModSecurity config, CRS setup, and rules
COPY modsecurity/modsecurity.conf /etc/nginx/modsec/modsecurity.conf
COPY modsecurity/crs-setup.conf /etc/nginx/modsec/crs-setup.conf
COPY modsecurity/rules/ /etc/nginx/modsec/rules/

# Expose HTTP and HTTPS ports
EXPOSE 80 443