# Stage 1: Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
# Use npm ci with specific flags for better performance
RUN npm ci --prefer-offline --no-audit

# Copy source code and configuration files
COPY . .

# Build the application with increased memory (optimized for 2GB RAM instances)
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN npm run build

# Stage 2: Production Stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production --prefer-offline --no-audit

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy templates directory (needed for PDF generation)
COPY --from=builder /app/templates ./templates

# Create config directory for runtime (Firebase credentials should be mounted as volume)
RUN mkdir -p /app/config/firebase

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the application port (default 4200, can be overridden)
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4200/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main"]
