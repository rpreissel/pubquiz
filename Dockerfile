# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy backend source
COPY backend ./backend

# Create data directory
RUN mkdir -p data/quizzes data/teams

# Expose port
EXPOSE 3000

# Start server (serves both API and static frontend)
CMD ["node", "--import", "tsx", "backend/server.ts"]
