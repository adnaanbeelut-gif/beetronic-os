# Build stage
FROM node:18-alpine AS builder

WORKDIR /build

# Copy backend source
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src

# Build backend
WORKDIR /build/backend
RUN npm ci && npm run build

# Copy frontend source
COPY frontend/package*.json /build/frontend/
COPY frontend/vite.config.ts /build/frontend/
COPY frontend/src /build/frontend/src
COPY frontend/public /build/frontend/public
COPY frontend/index.html /build/frontend/

# Build frontend
WORKDIR /build/frontend
RUN npm ci && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy backend from builder
COPY --from=builder /build/backend/dist ./backend/dist
COPY --from=builder /build/backend/node_modules ./backend/node_modules
COPY --from=builder /build/backend/package.json ./backend/
COPY backend/src/config/schema.sql ./backend/src/config/

# Copy frontend from builder
COPY --from=builder /build/frontend/dist ./frontend/dist

# Copy environment
COPY .env.production .env

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/index.js"]
