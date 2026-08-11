# Sfera IT Academy - Gamifikatsiya va Davomat Tizimi

Ushbu loyiha zamonaviy o'quv markazlari (xususan, **Sfera IT Academy**) uchun mo'ljallangan bo'lib, o'quvchilarning faolligini oshirish (gamifikatsiya), darslardagi davomatini va ballarini boshqarish uchun to'liq funksional tizim hisoblanadi.

---

## 🌟 Tizim Imkoniyatlari

### 👥 Rollar va Ruxsatnomalar
1. **Admin (Tizim boshqaruvchisi)**
   * Mentorlar (o'qituvchilar) va guruhlarni yaratish, tahrirlash hamda o'chirish.
   * O'quvchilarni qo'shish va ularni guruhlarga biriktirish.
   * Excel orqali o'quvchilarni ommaviy import qilish (Bulk Import).
   * Barcha guruhlar, mentorlar va o'quvchilar reytingi hamda davomatini ko'rish.
   * Tizim qoidalari va ballarini boshqarish.
2. **Mentor (O'qituvchi)**
   * Faqat o'ziga biriktirilgan guruhlarni ko'rish.
   * Jurnal (Journal) qismida o'quvchilarga davomat belgilash va dars bo'yicha ball qo'yish/ayirish.
   * Darsdan tashqari loyihalar bo'yicha o'quvchilarga tezkor ball qo'yish (Tezkor Baholash).
   * O'z guruhlari reytingi va davomatini filtrlar yordamida ko'rish.
3. **Student (O'quvchi)**
   * Shaxsiy Dashboard: umumiy yig'ilgan ball (XP), daraja (Level), va guruhdagi o'rni.
   * Shaxsiy davomat tarixi (Darsga kelgan kunlari, sababli va sababsiz dars qoldirishlar).
   * Ballar tarixi (Point History): qaysi qoida bo'yicha necha ball berilgani yoki ayirilgani.
   * O'z guruhi bo'yicha reyting (Leaderboard).

---

## 🛠 Texnologiyalar Guruhi (Tech Stack)

### 🖥 Backend
* **Til:** Java 17
* **Freymvork:** Spring Boot 3.2.5
* **Ma'lumotlar bazasi:** PostgreSQL
* **Xavfsizlik:** Spring Security & JWT (Json Web Token)
* **Kutubxonalar:** Lombok, JPA / Hibernate, Jwts

### 🎨 Frontend
* **Kutubxona:** React 19 (Hooks, Context API)
* **Yig'uvchi (Bundler):** Vite 8
* **Dizayn & Styling:** Tailwind CSS v4 (Sariq, indigo, zumrad va quyuq ranglar palitrasi)
* **Ikonkalar:** Lucide React
* **Tarmoq so'rovlari:** Axios

---

## 🚀 Loyihani Lokal Ishga Tushirish

### 📋 Talablar
* Java 17 SDK
* Node.js (v18 yoki undan yuqori)
* PostgreSQL Server

### 1. Ma'lumotlar Bazasini Sozlash
PostgreSQL-da yangi ma'lumotlar bazasini yarating:
```sql
CREATE DATABASE sfera_gamification;
```
Backend loyihasining `src/main/resources/application.properties` faylida ma'lumotlar bazasi username va parolini o'zingiznikiga moslang.

### 2. Backend Serverni Ishga Tushirish
`sfera-gamification-backend` papkasiga o'ting va quyidagi buyruqni bajaring:
```bash
mvn spring-boot:run
```
Server sukut bo'yicha `http://localhost:8080` portida ishga tushadi.

### 3. Frontend Dev Serverni Ishga Tushirish
`sfera-gamification-frontend` papkasiga o'ting, bog'liqliklarni o'rnating va ishga tushiring:
```bash
npm install
npm run dev
```
Frontend loyihasi `http://localhost:5174` portida ishga tushadi va backend bilan proxy orqali bog'lanadi.

---

## 🔑 Tizimdagi Default Akkauntlar (Seed Data)

Ma'lumotlar bazasi bo'sh bo'lgan taqdirda, backend ishga tushishi bilan quyidagi foydalanuvchilar avtomatik ravishda yaratiladi:

| Rol | Username | Parol |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Mentor 1** | `quvonchbek` | `mentor123` |
| **Mentor 2** | `muhammad` | `mentor123` |
| **Student** | O'quvchi ismi-familiyasi (`ism_familiya`) | `student123` |

---

## 🔒 Xavfsizlik va Arxitektura
* Barcha API so'rovlari JWT bearer token orqali himoyalangan.
* O'quvchilar va mentorlarning parollari ma'lumotlar bazasida **BCrypt** algoritmi yordamida shifrlangan holatda saqlanadi.
* CORS sozlamalari va ma'lumotlar xavfsizligi to'liq ta'minlangan.

---

## 🌐 GitHub va Serverga Deploy Qilish (Production)

Loyihani to'liq GitHub-ga joylash va serverga deploy qilish bo'yicha yo'riqnoma:

### 1. Maxfiy Ma'lumotlarni Himoyalash (Secrets & Config)
`application.properties` faylida barcha maxfiy kalitlar va DB sozlamalari muhit o'zgaruvchilari (Environment Variables) orqali boshqariladi.

Serverda yoki CI/CD tizimida quyidagi o'zgaruvchilarni o'rnating:
* `SPRING_DATASOURCE_URL` - PostgreSQL ma'lumotlar bazasi URL'i.
* `SPRING_DATASOURCE_USERNAME` - DB foydalanuvchi nomi.
* `SPRING_DATASOURCE_PASSWORD` - DB paroli.
* `JWT_SECRET` - JWT tokenlarini shifrlash uchun kamida 256-bitli maxfiy kalit.
* `MEGALLM_API_KEY` - MegaLLM API kaliti.
* `MEGALLM_MODEL` - MegaLLM model nomi (sukut bo'yicha: `llama3.3-70b-instruct`).
* `MEGALLM_API_URL` - MegaLLM chat completions API URL'i.

---

### 2. Backend-ni Deploy Qilish (Spring Boot & Systemd)

Backend JAR faylini serverga yuklab, systemd xizmati sifatida ishga tushirish qadamlari:

1. **Systemd service yaratish:**
   `/etc/systemd/system/sfera-gamification.service` faylini yarating va loyihaning `deployment/sfera-gamification.service` shablonidan foydalanib sozlang.
2. **Xizmatni yoqish va ishga tushirish:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable sfera-gamification
   sudo systemctl start sfera-gamification
   ```
3. **PowerShell yordamida deploy (deploy.ps1):**
   Agarda siz lokal Windows kompyuteringizdan turib deploy qilmoqchi bo'lsangiz, `sfera-gamification-backend/deploy.ps1` skriptidan foydalanishingiz mumkin:
   ```powershell
   ./deploy.ps1 -Server "89.116.30.180" -User "root"
   ```

---

### 3. Frontend-ni Deploy Qilish (Vite & Nginx)

Frontend dasturini build qilib, Nginx veb-serveri orqali production uchun xizmat ko'rsatishga tayyorlash:

1. **Lokal yoki CI/CD build:**
   ```bash
   cd sfera-gamification-frontend
   npm install
   npm run build
   ```
   Bu buyruq `dist/` papkasida statik fayllarni yaratadi.
2. **Statik fayllarni serverga yuklash:**
   `dist/` papkasi ichidagi barcha fayllarni serverdagi `/var/www/sfera-gamification` manziliga yuklang:
   ```bash
   scp -r dist/* root@89.116.30.180:/var/www/sfera-gamification/
   ```
3. **Nginx Konfiguratsiyasi:**
   Nginx server blokida (masalan: `/etc/nginx/sites-available/default`) quyidagi sozlamani qo'llang:
   ```nginx
   server {
       listen 80;
       server_name 89.116.30.180; # Yoki o'z domeningiz

       root /var/www/sfera-gamification;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Backend API proxy
       location /api/ {
           proxy_pass http://127.0.0.1:8080/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
4. **Nginx-ni qayta ishga tushirish:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

### 4. GitHub Actions CI/CD Pipeline

Loyihaga GitHub avtomatik testlash va deploy qilish quvurlari (workflows) o'rnatilgan:
* **Backend:** `.github/workflows/backend-ci.yml` fayli orqali loyihani push qilinganda avtomatik Maven yordamida build qiladi.
* **Frontend:** `.github/workflows/frontend-ci.yml` fayli orqali push qilinganda npm bog'liqliklarini o'rnatib build qiladi.

Avtomatik deployni yoqish uchun GitHub repo sozlamalaridagi **Settings -> Secrets and variables -> Actions** qismiga quyidagi maxfiy kalitlarni (secrets) qo'shing:
* `DEPLOY_HOST`: `89.116.30.180`
* `DEPLOY_USER`: `root`
* `SSH_PRIVATE_KEY`: Serverga kirish uchun maxfiy SSH kalit.
* `MEGALLM_API_KEY`: MegaLLM API kaliti.
