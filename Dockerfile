FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev


FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER appuser
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s \
CMD wget -qO- http://localhost:5000/health || exit 1
CMD ["node", "app.js"]