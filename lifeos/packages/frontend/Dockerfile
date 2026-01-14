# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Set the internal API URL for Docker networking
ARG INTERNAL_API_URL=http://backend:5000
ENV INTERNAL_API_URL=${INTERNAL_API_URL}

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code (separate layer)
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV INTERNAL_API_URL http://backend:5000

# Start with dumb-init
CMD ["dumb-init", "node", "server.js"]
