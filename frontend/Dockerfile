FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080
CMD ["npx", "http-server", "-p", "8080", "-a", "0.0.0.0"]
