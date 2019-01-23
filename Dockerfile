FROM node:alpine

WORKDIR /usr/src/app

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

#RUN apt-get update && apt-get install -y \
#		yarn \
#	&& rm -rf /var/lib/apt/lists/*

COPY . .

RUN sed -e "s/\"target/\"target_/g"  -e "s/\_target/target/g" -i.bak package.json && yarn install

ENTRYPOINT yarn start
