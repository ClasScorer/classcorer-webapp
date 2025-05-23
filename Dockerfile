# Build stage
FROM node:20-alpine3.17 AS builder

# Set working directory
WORKDIR /app

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache python3 make g++ libc6-compat openssl1.1

# Copy package files first for better caching
COPY package*.json ./
# Use legacy-peer-deps to bypass the React version conflict
RUN npm ci --legacy-peer-deps

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine3.17 AS runner

WORKDIR /app

# Install only production dependencies
RUN apk add --no-cache libc6-compat openssl1.1

# Copy necessary files from build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
