FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps --fetch-timeout=600000

COPY . .

RUN npx prisma generate

CMD ["npx", "tsx", "src/worker/index.ts"]