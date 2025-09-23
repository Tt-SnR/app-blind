# -----------------------------
# 1. Base image: Node 22 (hoặc 20 LTS)
# -----------------------------
FROM node:22-alpine AS builder

# Tạo thư mục làm việc
WORKDIR /app

# Copy package trước để tối ưu cache layer
COPY package*.json tsconfig.json ./

# Cài deps cho build
RUN npm ci

# Copy toàn bộ source
COPY src ./src

# Build Typescript -> JS
RUN npm run build    # cần script "build": "tsc"

# -----------------------------
# 2. Runtime image (nhỏ hơn)
# -----------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Chỉ copy dist và node_modules cần thiết
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Biến môi trường
ENV NODE_ENV=production
ENV PORT=4000

# Expose port Hono
EXPOSE 4000

# Start server
CMD ["node", "dist/index.js"]
