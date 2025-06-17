# Use the official Bun image
FROM oven/bun:1-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/
COPY config.ts ./

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bun -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R bun:nodejs /app
USER bun

# Expose port (if needed for health checks or monitoring)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run --version || exit 1

# Start the application
CMD ["bun", "run", "src/index.ts"] 