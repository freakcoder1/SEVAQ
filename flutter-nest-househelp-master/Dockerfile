# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Copy start.js to app directory
COPY start.js ./start.js
RUN npm install --legacy-peer-deps
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Copy start.js from builder stage
COPY --from=builder /app/start.js ./start.js
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "start.js"]
