# iSchool Production Deployment Guide

This directory contains pre-tuned production configuration files and automation scripts to host **iSchool** on any Linux VPS (Ubuntu 22.04 / 24.04 LTS).

---

## 📁 Directory Structure

| File | Destination on VPS | Purpose |
| :--- | :--- | :--- |
| [`ischool.conf`](./nginx/ischool.conf) | `/etc/nginx/sites-available/ischool.conf` | Nginx reverse proxy + SSL + Gzip + Caching |
| [`opcache.ini`](./php/opcache.ini) | `/etc/php/8.2/fpm/conf.d/10-opcache.ini` | PHP-FPM OPcache and JIT compilation tuning |
| [`www-pool.conf`](./php/www-pool.conf) | `/etc/php/8.2/fpm/pool.d/www.conf` | PHP-FPM process worker pool configuration |
| [`my.cnf`](./mysql/my.cnf) | `/etc/mysql/conf.d/ischool.cnf` | MySQL InnoDB buffer pool & IOPS tuning |
| [`ecosystem.config.js`](../ecosystem.config.js) | Project Root | PM2 process manager for Next.js and Queue worker |
| [`deploy.sh`](./deploy.sh) | `deploy/deploy.sh` | Automated zero-downtime deployment script |

---

## 🚀 Quick Setup on Ubuntu 22.04 / 24.04 LTS

### Step 1: Install Required Packages
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Nginx, MySQL, Redis, Node.js 20/22, and PHP 8.2/8.3
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nginx mysql-server redis-server nodejs git unzip curl

# 3. Add PHP PPA and install PHP extensions
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-bcmath \
    php8.2-curl php8.2-gd php8.2-zip php8.2-redis php8.2-intl php8.2-opcache

# 4. Install Composer & PM2
curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer
sudo npm install -g pm2
```

### Step 2: Configure Services
```bash
# Copy Nginx Config
sudo cp deploy/nginx/ischool.conf /etc/nginx/sites-available/ischool.conf
sudo ln -s /etc/nginx/sites-available/ischool.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Copy PHP-FPM and OPcache Configs
sudo cp deploy/php/opcache.ini /etc/php/8.2/fpm/conf.d/10-opcache.ini
sudo cp deploy/php/www-pool.conf /etc/php/8.2/fpm/pool.d/www.conf

# Copy MySQL Config
sudo cp deploy/mysql/my.cnf /etc/mysql/conf.d/ischool.cnf

# Restart Services
sudo systemctl restart php8.2-fpm
sudo systemctl restart mysql
sudo systemctl restart nginx
```

### Step 3: SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 4: Run Automated Deployment
```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```
