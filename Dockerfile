FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci && npm cache clean --force
COPY src ./src
COPY circuits ./circuits
RUN npm run build

FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/circuits/build ./circuits/build
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
