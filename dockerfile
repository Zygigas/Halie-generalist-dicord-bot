# Use official Node.js image
FROM node:22-alpine

# Install Python, which is a dependency for youtube-dl-exec
RUN apk update && apk add --no-cache python3 py3-pip make g++ build-base

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source files
COPY . .

# build TypeScript
RUN npm run build  # Compiles TS to JS in /dist

# Start the bot
CMD [ "npm", "start" ]