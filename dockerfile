# syntax=docker/dockerfile:1
FROM node:18.16.0-bookworm-slim

WORKDIR /app

COPY . .

RUN bash -c "npm install"

EXPOSE 5000

CMD ["node", "index.js"]