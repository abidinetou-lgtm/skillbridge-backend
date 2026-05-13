# 🎬 Users & Movies API

API REST développée avec **Node.js, Express et Prisma** permettant de gérer des utilisateurs et des films avec authentification JWT.

---

## 📸 Aperçu des tests API

### 🔐 Register
<img src="zscreens/register.png" width="800"/>

### 🔑 Login
<img src="zscreens/login.png" width="800"/>

### 👤 Get Me
<img src="zscreens/me.png" width="800"/>

### 🎬 Create Movie
<img src="zscreens/create-movie.png" width="800"/>

### 📄 Get Movies
<img src="zscreens/get-movies.png" width="800"/>

### 🔍 Search Movie
<img src="zscreens/search-movie.png" width="800"/>

### 🔁 Update Movie
<img src="zscreens/update-movie.png" width="800"/>

### 🗑️ Delete Movie
<img src="zscreens/delete-movie.png" width="800"/>

### 📊 Users Pagination
<img src="zscreens/users-pagination.png" width="800"/>

---

## 🚀 Fonctionnalités

### 🔐 Authentification
- Inscription (`/api/auth/register`)
- Connexion (`/api/auth/login`)
- Utilisateur connecté (`/api/auth/me`)

### 👤 Utilisateurs
- CRUD utilisateurs
- Pagination (`/api/users?page=1&limit=2`)
- Routes protégées
- Password sécurisé (bcrypt)

### 🎬 Movies
- CRUD complet
- Recherche (`/api/movies/search`)
- Routes protégées

---

## ▶️ Lancer le projet

```bash
npm install
npm run dev
