# syntax=docker/dockerfile:1

# Frontend builder stage
FROM oven/bun:1 AS frontend-builder
WORKDIR /frontend

# Install dependencies
COPY frontend/package.json frontend/bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source files
COPY frontend/src/ src/
COPY frontend/index.html .
COPY frontend/tsconfig.json .
COPY frontend/vite.config.mjs .

# Build the frontend
RUN bun run build

# Backend builder stage
FROM oven/bun:1 AS backend-builder
WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY tsconfig.json .
COPY src/ src/

# Build the backend
RUN bun run build

# Final production stage
FROM oven/bun:1-slim
WORKDIR /app

# Copy built artifacts from previous stages
COPY --from=frontend-builder /frontend/dist/ ./frontend/dist
COPY --from=backend-builder /app/dist/ ./dist/

# Only copy production dependencies
COPY package.json ./
RUN bun install --production --frozen-lockfile

# Set environment variables
ENV PORT=80
ENV MONGODB_URI=mongodb://db:27017/friendship-network
ENV APP_URL=http://localhost:80
ENV ENABLE_REGISTRATION=true

# Expose the port
EXPOSE 80

# Health check to verify the application is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1

# Start the application
CMD ["bun", "run", "start"]