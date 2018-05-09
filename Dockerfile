FROM node:latest

WORKDIR /usr/src/app

#RUN apt-get update && apt-get install -y \
#		yarn \
#	&& rm -rf /var/lib/apt/lists/*

COPY . .

RUN yarn install && yarn build

CMD yarn
