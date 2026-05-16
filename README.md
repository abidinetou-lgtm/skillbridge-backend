# SkillBridge Backend

Backend API for the SkillBridge learning and collaboration platform.

---

# Tech Stack

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Prisma ORM
* JWT Authentication

---

# Current Features

## Authentication System

* User registration
* User login
* JWT authentication
* Protected routes
* Role system (USER / ADMIN)

## User Profile System

* Update user profile
* Add teaching skills
* Remove skills
* Add learning goals
* Search users by skills and profile data

## Database

* PostgreSQL database
* Prisma schema relations
* Prisma migrations
* Prisma Studio support

---

# Project Structure

```bash
src/
 ├── controllers/
 ├── middleware/
 ├── routes/
 ├── services/
 ├── utils/
 ├── types/
 └── server.ts

prisma/
 ├── schema.prisma
 └── migrations/
```

---

# Installation

## 1. Clone repository

```bash
git clone <repository-url>
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/skillbridge"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
```

---

## 4. Generate Prisma client

```bash
npx prisma generate
```

---

## 5. Run migrations

```bash
npx prisma migrate dev --name init
```

---

## 6. Start development server

```bash
npm run dev
```

---

# Useful Commands

## Start server

```bash
npm run dev
```

## Prisma generate

```bash
npx prisma generate
```

## Prisma migrations

```bash
npx prisma migrate dev --name migration_name
```

## Open Prisma Studio

```bash
npx prisma studio
```

## Build project

```bash
npm run build
```

---

# API Routes

## Auth Routes

| Method | Route          | Description                    |
| ------ | -------------- | ------------------------------ |
| POST   | /auth/register | Register new user              |
| POST   | /auth/login    | Login user                     |
| GET    | /auth/me       | Get current authenticated user |

---

## User Routes

| Method | Route                     | Description                 |
| ------ | ------------------------- | --------------------------- |
| PUT    | /users/me                 | Update current user profile |
| POST   | /users/skills             | Add teaching skill          |
| DELETE | /users/skills/:id         | Remove teaching skill       |
| POST   | /users/learning-goals     | Add learning goal           |
| DELETE | /users/learning-goals/:id | Remove learning goal        |
| GET    | /users/search?q=          | Search users                |

---

# Git Workflow

## Rules

* Never work directly on `main`
* Always create feature branches
* Pull latest changes before working
* Use clean commit messages

---

## Example Workflow

```bash
git checkout main
git pull
git checkout -b feature-name
```

After development:

```bash
git add .
git commit -m "feat(module): description"
git push
```

---

# Current Team Roles

## Yahia

* Backend architecture
* Authentication system
* User system
* Prisma/PostgreSQL
* Matching system
* Security & middleware

## Mahamane

* Chat system
* Socket.IO
* Conversations & messages
* Sessions
* Notifications
* Rewards system

---

# Upcoming Features

* Matching system
* Real-time chat
* Teaching sessions
* Rewards system
* Admin dashboard
* Notifications system

---

# Development Notes

* Prisma schema should never be modified without migration
* Always run Prisma generate after schema updates
* Keep services/controllers/routes separated
* Use modular architecture
* Use validation for all inputs

---

# License

Educational project — SkillBridge Team
readme
