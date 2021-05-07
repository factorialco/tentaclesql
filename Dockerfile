# Build stage
FROM node:14.16.1-alpine AS build

MAINTAINER Factorial <admin@factorial.co>

COPY . /app

WORKDIR /app

RUN apk update && apk add --update-cache --virtual build-dependencies python make g++ && \
    yarn install --frozen-lockfile && \
    yarn build && \
    yarn cache clean && \
    apk del build-dependencies

# Release stage
FROM node:14.16.1-alpine

MAINTAINER Factorial <admin@factorial.co>

COPY --from=build /app/package.json /app/yarn.lock /app/dist/ /app/

WORKDIR /app

RUN apk update && apk add --update-cache --virtual build-dependencies python make g++ && \
    yarn install --frozen-lockfile --production && \
    yarn cache clean && \
    apk del build-dependencies

EXPOSE 8080/tcp

ENTRYPOINT ["node", "/app/dist/server.js"]
