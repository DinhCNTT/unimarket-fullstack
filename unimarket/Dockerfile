# --- Giai đoạn 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Giai đoạn 2: Run ---
FROM nginx:alpine

# Xóa config mặc định
RUN rm /etc/nginx/conf.d/default.conf

# Copy config của mình vào
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Xóa html cũ
RUN rm -rf /usr/share/nginx/html/*

# 👇 Copy code đã build vào
COPY --from=build /app/dist /usr/share/nginx/html

# 👇 QUAN TRỌNG: Cấp quyền đọc file cho Nginx (Fix lỗi 403/404)
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]