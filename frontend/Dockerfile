# Stage 1: Build Vite React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install

# Cấu hình build được truyền tường minh, KHÔNG đọc frontend/.env (đã bị .dockerignore loại).
# Ví dụ: docker build --build-arg VITE_API_BASE_URL=https://api.example.com .
ARG VITE_API_BASE_URL=
ARG VITE_QR_BASE_URL=
ARG VITE_USE_SAMPLE_DATA=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_QR_BASE_URL=$VITE_QR_BASE_URL
ENV VITE_USE_SAMPLE_DATA=$VITE_USE_SAMPLE_DATA

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
