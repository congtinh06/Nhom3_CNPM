# Stage 1: Build Vite React
FROM node:20-alpine AS build
WORKDIR /app

# npm ci: cai dat deterministic theo package-lock.json (khong tu cap nhat lockfile)
COPY package.json package-lock.json ./
RUN npm ci

# Cau hinh build duoc truyen tuong minh, KHONG doc frontend/.env (da bi .dockerignore loai).
# Vi du: docker build --build-arg VITE_API_BASE_URL=https://api.example.com .
ARG VITE_API_BASE_URL=
ARG VITE_QR_BASE_URL=
ARG VITE_USE_SAMPLE_DATA=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_QR_BASE_URL=$VITE_QR_BASE_URL
ENV VITE_USE_SAMPLE_DATA=$VITE_USE_SAMPLE_DATA

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx (unprivileged: chay uid 101, listen 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER 101
EXPOSE 8080

# Healthcheck dung wget (busybox co san trong image alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
