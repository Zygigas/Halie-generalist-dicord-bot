# Use official Node.js image
FROM node:18-alpine

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