# Stage 1: Build app
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# Stage 2: Run static files with a tiny server
FROM node:22-slim AS production
WORKDIR /app

# Cài serve nhỏ gọn để phục vụ static (chỉ 1 lệnh)
RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
