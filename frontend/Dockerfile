# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build        # must produce /app/dist

# --- serve stage ---
FROM nginx:alpine
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY --from=build /app/dist/ /usr/share/nginx/html/dist/

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY ai-pong.html /usr/share/nginx/html/
COPY dashboard.html /usr/share/nginx/html/
COPY logo.png /usr/share/nginx/html/
COPY hearts.gif /usr/share/nginx/html/
COPY powerpuff-bg.webp /usr/share/nginx/html/
COPY avatars/ /usr/share/nginx/html/avatars/
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

