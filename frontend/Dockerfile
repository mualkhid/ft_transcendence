FROM nginx:alpine

# Copy the built files to nginx
COPY dist/ /usr/share/nginx/html/
COPY index.html /usr/share/nginx/html/
COPY logo.png /usr/share/nginx/html/
COPY hearts.gif /usr/share/nginx/html/
COPY avatars/ /usr/share/nginx/html/avatars/

# Copy custom nginx config to conf.d directory
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
