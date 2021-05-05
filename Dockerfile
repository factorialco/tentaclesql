FROM node:14.16.1

MAINTAINER Genar <genar@factorial.co>

COPY . /app

WORKDIR /app

RUN yarn install --frozen-lockfile

ENV NODE_ENV production
ENV API_DOMAIN https://api.example.com

EXPOSE 8080/tcp

ENTRYPOINT ["yarn", "start"]
