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
