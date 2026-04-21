FROM node:20-alpine

WORKDIR /usr/src/notification-service

ENV AWS_REGION=us-east-2
ENV AWS_ACCESS_KEY_ID=replace-me
ENV AWS_SECRET_ACCESS_KEY=replace-me
ENV SES_FROM_EMAIL=no-reply@example.com
ENV PORT=3003

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3003

CMD ["node", "dist/src/index.js"]
