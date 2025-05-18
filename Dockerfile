FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache python3 make g++ libc6-compat openssl

# Copy package files
COPY package*.json ./

# Install dependencies with legacy-peer-deps to bypass React version conflicts
RUN npm ci --legacy-peer-deps

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy remaining app files
COPY . .

# Expose the port
EXPOSE 3000

# Use development command
CMD ["npm", "run", "dev"] 