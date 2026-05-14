# Deployment Guide: Nginx & Domain Setup

Dokumen ini menjelaskan cara men-deploy Kopi Tiang Alam ke server production (seperti Ubuntu) menggunakan Nginx dan Domain.

## 1. Persiapan Server
1. Clone repositori ke `/var/www/kopi-tiang-alam`
2. Jalankan build project:
   ```bash
   pnpm install
   pnpm run build
   ```
3. Pastikan backend API berjalan dengan daemon (misal PM2):
   ```bash
   # Di dalam folder root
   npm install -g pm2
   pm2 start "cross-env NODE_ENV=production pnpm --filter @workspace/api-server run start" --name api-server
   ```

## 2. Setup Nginx
1. Salin konfigurasi Nginx dari `nginx.conf`:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/kopi-tiang-alam
   ```
2. Ganti `example.com` di file konfigurasi dengan nama domain Anda yang sebenarnya.
3. Buat symlink untuk mengaktifkannya:
   ```bash
   sudo ln -s /etc/nginx/sites-available/kopi-tiang-alam /etc/nginx/sites-enabled/
   ```
4. Verifikasi konfigurasi dan restart Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 3. Setup SSL (Opsional namun disarankan)
Untuk mengamankan website dengan HTTPS menggunakan Certbot (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```
Certbot secara otomatis akan memodifikasi file konfigurasi Nginx untuk menggunakan sertifikat SSL.
