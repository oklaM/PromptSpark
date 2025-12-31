FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files to leverage cache
COPY package.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY extension/package.json extension/

# Install dependencies from root
# We install all deps (including dev) to ensure build works
RUN npm install

# Copy backend source code
COPY backend/ backend/

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json
# For a simpler setup, we copy node_modules. 
# In a highly optimized setup, we would prune devDependencies.
COPY --from=builder /app/node_modules ./node_modules

# Create data directory for SQLite
RUN mkdir -p data

ENV PORT=5000
ENV NODE_ENV=production
# Force database path to be in the volume mount point
ENV DATABASE_PATH=/app/data/promptspark.db

EXPOSE 5000

CMD ["node", "dist/index.js"]
