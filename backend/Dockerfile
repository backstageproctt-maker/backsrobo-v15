# Usar uma imagem estável do Node.js
FROM node:20-slim

# Instalar dependências necessárias para o sistema
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Criar pasta do app
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (apenas produção para ser mais rápido)
RUN npm install --omit=dev

# Copiar o restante do código (versão já compilada)
COPY . .

# Expor a porta que o Render vai usar
EXPOSE 8080

# Comando para ligar o motor
CMD ["node", "dist/server.js"]
