# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY extension/package.json extension/

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend/ frontend/

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy build artifacts to Nginx html directory
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
