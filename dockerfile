FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# bundle app source
COPY . .

VOLUME /usr/src/app

EXPOSE 3000
CMD ["npm", "start"]