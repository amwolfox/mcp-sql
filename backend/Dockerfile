FROM node:20.14-bullseye

WORKDIR /app

# Install dependencies (including dev deps for build)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript to JS
RUN npx tsc --outDir dist

EXPOSE 3001

ENV NODE_ENV=production

# Run the compiled JS
CMD ["node", "dist/server.js"]
