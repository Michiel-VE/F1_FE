FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev

USER node

EXPOSE 4000
CMD ["node", "dist/f1_app/server/server.mjs"]