FROM node:22-alpine
WORKDIR /app
RUN npm config set fetch-retries 5
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/server.js"]