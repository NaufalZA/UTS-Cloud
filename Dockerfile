# Gunakan image Node.js versi ringan
FROM node:18-alpine

# Buat direktori kerja di dalam container
WORKDIR /app

# Salin file daftar library, lalu install
COPY package*.json ./
RUN npm install

# Salin seluruh file kode aplikasi ke dalam container
COPY . .

# Buka port 80 untuk lalu lintas web
EXPOSE 80

# Perintah untuk menjalankan server
CMD ["npm", "start"]