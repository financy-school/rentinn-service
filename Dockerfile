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
# Using Debian-slim for better PhantomJS compatibility
FROM node:18-slim AS production

# Install system dependencies for PhantomJS and PDF generation
RUN apt-get update && apt-get install -y \
    libfontconfig1 \
    libfreetype6 \
    libpng16-16 \
    libjpeg62-turbo \
    libx11-6 \
    libxext6 \
    libxrender1 \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create a non-root user for security (Debian-style)
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nestjs

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production --prefer-offline --no-audit

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy templates directory (needed for PDF generation)
COPY --from=builder /app/templates ./templates

# Copy source notification templates (needed for email notifications)
COPY --from=builder /app/src/client/notification/templates ./src/client/notification/templates

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
