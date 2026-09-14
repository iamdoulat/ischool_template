# Decoupled Hosting Guide: iSchool

This guide explains how to host the **Laravel 12 Backend** on **HestiaCP / cPanel** and the **Next.js 16 Frontend** on **Vercel / Netlify / Coolify**.

---

## 🏗️ Architecture Overview

```
                     ┌────────────────────────────────────────────────┐
                     │              Frontend (Next.js 16)             │
                     │    Vercel / Netlify / Coolify                  │
                     │    Domain: https://school.yourdomain.com       │
                     └───────────────────────┬────────────────────────┘
                                             │
                       REST API Requests     │  NEXT_PUBLIC_API_URL
                       (Bearer Token Auth)   │  = https://api.yourdomain.com/api/v1
                                             ▼
                     ┌────────────────────────────────────────────────┐
                     │              Backend (Laravel 12)              │
                     │    HestiaCP / cPanel (PHP 8.2/8.3 + MySQL)     │
                     │    Domain: https://api.yourdomain.com          │
                     └────────────────────────────────────────────────┘
```

---

## Part 1: Backend Deployment (HestiaCP / cPanel)

### 1. Domain / Subdomain Setup
1. Create a subdomain for the API: e.g. `api.yourdomain.com`.
2. **Important Document Root**:
   - In **HestiaCP**: Edit Web Domain $\rightarrow$ Advanced Options $\rightarrow$ Custom document root $\rightarrow$ set to `/home/user/web/api.yourdomain.com/public_html/backend/public` (or `.../public`).
   - In **cPanel**: Subdomains $\rightarrow$ Document Root $\rightarrow$ set to `public_html/backend/public`.

### 2. Upload Backend Files
Upload the contents of `backend/` to your server.

### 3. Configure `.env` on Backend
Create `/backend/.env`:
```env
APP_NAME=iSchool
APP_ENV=production
APP_KEY=base64:... (generate using: php artisan key:generate)
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_cpanel_database
DB_USERNAME=your_cpanel_user
DB_PASSWORD=your_cpanel_password

FRONTEND_URL=https://school.yourdomain.com
SANCTUM_STATEFUL_DOMAINS=school.yourdomain.com,yourdomain.com

CACHE_STORE=file
QUEUE_CONNECTION=database
SESSION_DRIVER=file
FILESYSTEM_DISK=public
```

### 4. Run Artisan Commands (via SSH or cPanel Terminal)
```bash
cd /path/to/backend
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5. Setup Cron Job (cPanel / HestiaCP)
Add a cron job to run **every minute**:
```bash
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## Part 2: Frontend Deployment (Vercel / Netlify / Coolify)

### Option A: Vercel (Recommended for Next.js)
1. Push your repository to GitHub / GitLab.
2. Go to [Vercel](https://vercel.com) $\rightarrow$ **Add New Project** $\rightarrow$ Import your repository.
3. Configure Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (Root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
   ```
5. Click **Deploy**.
6. Under **Settings** $\rightarrow$ **Domains**, add `school.yourdomain.com`.

---

### Option B: Coolify (Self-Hosted on VPS)
1. In Coolify dashboard, select **Add Resource** $\rightarrow$ **Public/Private Git Repository**.
2. Select **Next.js** build pack or Dockerfile.
3. Set **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
   PORT=3000
   ```
4. Set Domain to `https://school.yourdomain.com`.
5. Click **Deploy**.

---

### Option C: Netlify
1. Connect Git repository to Netlify.
2. Set Build Command: `npm run build`
3. Publish Directory: `.next`
4. Install `@netlify/plugin-nextjs`.
5. Add Environment Variable:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
   ```
6. Deploy site and attach custom domain.

---

## Part 3: CORS & Cookie Verification Checklist

- [x] **Bearer Token Auth**: iSchool stores Sanctum tokens in `localStorage` and sends `Authorization: Bearer <token>` in Axios headers. This works cross-origin across separate subdomains (`school.yourdomain.com` $\rightarrow$ `api.yourdomain.com`) without cookie domain restriction issues.
- [x] **Cross-Origin Media**: All student photos, certificates, invoices, and app logos resolve automatically through `getImageUrl()` targeting `NEXT_PUBLIC_API_URL`.
- [x] **SSL**: Ensure both `https://school.yourdomain.com` and `https://api.yourdomain.com` have active SSL certificates (Let's Encrypt / AutoSSL) to prevent mixed-content blocking.
