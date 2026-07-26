FROM node:18-alpine

# Set direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependensi
RUN npm install --production

# Salin seluruh kode proyek ke dalam container
COPY . .

# Ekspos port yang digunakan aplikasi
EXPOSE 5000

# Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]
