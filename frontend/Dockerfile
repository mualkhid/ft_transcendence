
# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
ARG HOST_IP=localhost
COPY package*.json ./
RUN npm ci || npm install
RUN echo ">>> HOST_IP during build = ${HOST_IP}"
COPY . .
RUN npm run build        # must produce /app/dist
RUN sed -i "s/__HOST_IP__/$HOST_IP/g" dist/main.js

# --- serve stage ---
FROM nginx:alpine
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY --from=build /app/dist/ /usr/share/nginx/html/dist/

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY dashboard.html /usr/share/nginx/html/
COPY imgs/ /usr/share/nginx/html/imgs/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]