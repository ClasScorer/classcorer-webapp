# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache python3 make g++ libc6-compat openssl

# Copy package files and node_modules directly
COPY package*.json ./
COPY node_modules ./node_modules/

# Copy prisma schema first
COPY prisma ./prisma/

# Generate Prisma client with explicit binary target
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
RUN apk add --no-cache libc6-compat openssl

# Copy necessary files from build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
# Copy scripts directory for database seeding
COPY --from=builder /app/scripts ./scripts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
