FROM node:latest

WORKDIR /usr/app

RUN apt-get update && apt-get -y install \
  libreoffice \
  libsword-utils \
  zip

COPY package*.json ./

RUN npm install

COPY . .
