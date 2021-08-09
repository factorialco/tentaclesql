# Build stage
FROM node:14.16.1-alpine AS build

LABEL org.opencontainers.image.authors="Factorial <admin@factorial.co>"

COPY . /app

WORKDIR /app

RUN apk update && apk add --update-cache --virtual build-dependencies python make g++ && \
    yarn install --frozen-lockfile && \
    yarn build && \
    yarn cache clean && \
    apk del build-dependencies

COPY ./src/executor/database/sqlite_extensions /app/dist/sqlite_extensions

# Release stage
FROM node:14.16.1-alpine

LABEL org.opencontainers.image.authors="Factorial <admin@factorial.co>"

COPY --from=build /app/package.json /app/yarn.lock /app/dist /app/

WORKDIR /app

RUN apk update && apk add --update-cache --virtual build-dependencies python make g++ && \
    yarn install --frozen-lockfile --production && \
    yarn cache clean && \
    apk del build-dependencies

EXPOSE 8080/tcp

ENTRYPOINT ["node", "/app/server.js"]
