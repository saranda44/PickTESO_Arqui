# Etapa de build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# BUILD_CONFIGURATION define qué environment usa Angular.
# Por defecto usa production.
ARG BUILD_CONFIGURATION=production

RUN npm run build -- --configuration=${BUILD_CONFIGURATION} --base-href=/

# Producción con NGINX
FROM nginx:alpine

# Configuración SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia del build
COPY --from=build /app/dist/frontend-clients/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]