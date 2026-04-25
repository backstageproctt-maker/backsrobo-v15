# Usar uma imagem estável do Node.js
FROM node:20-slim

# Instalar dependências de sistema necessárias
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Criar pasta do app
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar TODAS as dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Gerar a pasta dist (compilar)
RUN npm run build

# Expor a porta
EXPOSE 8080

# Comando para ligar
CMD ["node", "dist/server.js"]
