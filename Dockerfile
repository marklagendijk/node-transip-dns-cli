FROM node:14-alpine
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
COPY . .
USER node
ENTRYPOINT [ "node", "."]
CMD [ "" ]
