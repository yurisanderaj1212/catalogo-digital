FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Build de Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
