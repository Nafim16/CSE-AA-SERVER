# syntax=docker/dockerfile:1
FROM node:18.16.0-bookworm-slim

WORKDIR /app

ENV NODE_ENV production

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g pm2

EXPOSE 5000

CMD ["pm2-runtime", "index.js"]