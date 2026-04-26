FROM node:20-alpine

WORKDIR /app

# ENV DATABASE_URL=postgresql://user:password@host:5432/dbname
# ENV CATALOG_SERVICE_URL=http://host.docker.internal:3099
# ENV STORE_ADMIN_SERVICE_URL=http://host.docker.internal:3099
# ENV PAYMENTS_SERVICE_URL=http://host.docker.internal:3099
# ENV NOTIFICATIONS_SERVICE_URL=http://host.docker.internal:3099
# ENV OTP_SECRET=replace-me
# ENV PORT=3002

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3002

CMD ["node", "dist/src/index.js"]
