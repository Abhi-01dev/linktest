FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=8081

# Expose port
EXPOSE 8081

# Start server
CMD ["node", "src/server.js"]
