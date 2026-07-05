FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN ./node_modules/.bin/vite build
EXPOSE 3001
CMD ["./node_modules/.bin/tsx", "server.ts"]
