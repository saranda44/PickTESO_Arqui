# Etapa de build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Dev build
# RUN npm run build
# Production build con base href
RUN npm run build -- --base-href=/sellers-panel/

# Producción con NGINX
FROM nginx:alpine

# Configuración SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia del build
COPY --from=build /app/dist/frontend-sellers/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]