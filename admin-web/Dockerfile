# syntax=docker/dockerfile:1
# Website admin (React + Vite) -> file statis yang disajikan nginx.
# VITE_API_URL tertanam saat BUILD, jadi harus diberikan lewat build arg.
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
