FROM node:20-slim
WORKDIR /app

# Install dependencies (including dev deps for the TypeScript build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Runtime settings
ENV PORT=3005
EXPOSE 3005

CMD ["node","dist/app.js"]
