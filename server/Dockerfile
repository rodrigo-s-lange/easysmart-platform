# Base oficial Node.js LTS
FROM node:20-alpine

# Diretório de trabalho no container
WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm install --production

# Copia o código-fonte
COPY src ./src

# Expõe a porta usada pelo servidor
EXPOSE 3000

# Comando padrão
CMD ["npm", "start"]
