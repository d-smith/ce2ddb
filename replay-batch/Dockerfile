FROM node:14
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY qr.js .
CMD ["node","qr.js"]