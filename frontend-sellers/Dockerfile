# Etapa de build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# BUILD_CONFIGURATION define qué environment usa Angular.
# Por defecto usa production.
ARG BUILD_CONFIGURATION=production

# BASE_HREF define la ruta base pública donde se servirá Angular.
# Por defecto es /vendedores/ porque en producción la app se monta en https://dominio/vendedores/.
# En local puede sobrescribirse a / desde docker-compose para usar http://localhost:4300/.
ARG BASE_HREF=/vendedores/

RUN npm run build -- --configuration=${BUILD_CONFIGURATION} --base-href=${BASE_HREF}

# Producción con NGINX
FROM nginx:alpine

# Configuración SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia del build
COPY --from=build /app/dist/frontend-sellers/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]