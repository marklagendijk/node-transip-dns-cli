FROM node:12-alpine
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
COPY . .
USER node
CMD [ "node", "bin/cli.js" ]
