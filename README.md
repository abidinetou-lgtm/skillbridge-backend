# SkillBridge — Backend

API REST pour la plateforme de troc de savoirs peer-to-peer.

## Stack

| Outil | Version | Rôle |
|---|---|---|
| Node.js | 18+ | Runtime |
| TypeScript | 6 | Typage |
| Express | 4 | Framework HTTP |
| Prisma | 5 | ORM |
| PostgreSQL | 15 | Base de données |
| Socket.IO | 4 | Temps réel (chat) |
| JWT | — | Authentification |
| bcryptjs | — | Hash des mots de passe |

## Lancer en local

```bash
# Cloner
git clone https://github.com/abidinetou-lgtm/skillbridge-backend.git
cd skillbridge-backend

# Installer
npm install

# Configurer l'environnement
cp .env.example .env
# Remplir DATABASE_URL et JWT_SECRET

# Créer et migrer la DB
npx prisma migrate dev --name init

# Lancer
npm run dev
# → http://localhost:5000
# → Test : http://localhost:5000/health
```

## Variables d'environnement

```env
DATABASE_URL=postgresql://postgres:motdepasse@localhost:5432/skillbridge
JWT_SECRET=skillbridge-secret-minimum-32-caracteres
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_EXPIRES_IN=7d
```

En production (Coolify) :
```env
DATABASE_URL=postgresql://...  (URL Coolify PostgreSQL)
NODE_ENV=production
CORS_ORIGIN=https://skillbridge.octilabs.com
```

## Structure du projet

```
backend/
├── prisma/
│   ├── schema.prisma       # Modèles DB
│   └── migrations/         # Historique des migrations
├── src/
│   ├── controllers/        # Logique de chaque route
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── matchController.ts
│   │   ├── conversationController.ts
│   │   └── sessionController.ts
│   ├── services/           # Logique métier
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── matchService.ts
│   │   └── sessionService.ts
│   ├── routes/             # Définition des endpoints
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── matchRoutes.ts
│   │   ├── conversationRoutes.ts
│   │   └── sessionRoutes.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts   # Vérification JWT
│   │   └── errorMiddleware.ts
│   ├── sockets/
│   │   └── index.ts            # Events Socket.IO
│   ├── utils/
│   │   ├── prisma.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── env.ts
│   │   └── httpError.ts
│   ├── app.ts              # Config Express + middlewares
│   └── server.ts           # Point d'entrée
├── Dockerfile
├── .env.example
└── package.json
```

## Routes API

### Auth
| Méthode | Route | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Inscription | Non |
| POST | `/auth/login` | Connexion → JWT | Non |
| GET | `/auth/me` | Profil connecté | Oui |

### Users
| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/users/search` | Recherche de profils | Oui |
| PUT | `/users/me` | Modifier son profil | Oui |
| POST | `/users/skills` | Ajouter une compétence | Oui |
| DELETE | `/users/skills/:id` | Supprimer | Oui |
| POST | `/users/learning-goals` | Ajouter un objectif | Oui |
| DELETE | `/users/learning-goals/:id` | Supprimer | Oui |

### Matches (Connexions)
| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/matches/suggestions` | Profils compatibles | Oui |
| POST | `/matches/request` | Envoyer une demande | Oui |
| GET | `/matches/mine` | Mes connexions | Oui |
| PATCH | `/matches/:id` | Accepter / Décliner | Oui |

### Conversations
| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/conversations` | Mes conversations | Oui |
| GET | `/conversations/:id/messages` | Messages d'une conv | Oui |
| POST | `/conversations/:id/messages` | Envoyer un message | Oui |

### Sessions
| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/sessions/mine` | Mes sessions | Oui |
| GET | `/sessions/:id` | Détail d'une session | Oui |
| POST | `/sessions` | Créer une session | Oui |
| POST | `/sessions/:id/join` | Rejoindre → Jitsi Room | Oui |
| POST | `/sessions/:id/end` | Terminer + crédits | Oui |

## Modèle de données principal

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  firstName    String
  lastName     String
  passwordHash String
  bio          String?
  credits      Int      @default(120)
  role         Role     @default(USER)
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime @default(now())
}
```

## Système de crédits

```
Inscription        → +120 crédits offerts
Donner un cours    → +N crédits (N = durée en minutes)
Recevoir un cours  → -N crédits
Session de groupe  → gratuite (0 crédit)
Solde minimum      → 0 (bloqué si insuffisant)
```

Le transfert se fait dans `POST /sessions/:id/end` :
```
creditsToTransfer = durée en minutes
teacher.credits  += creditsToTransfer
learner.credits  -= creditsToTransfer
```

## Branches Git

```
main    → production (Coolify)
dev     → développement commun
feat/*  → features
fix/*   → corrections
```

```bash
git checkout dev
git pull origin dev
git checkout -b feat/ma-feature
# ... coder ...
git add .
git commit -m "feat: description"
git push origin feat/ma-feature
# Pull Request → dev
```

## Déploiement — Coolify

Le backend est déployé via Docker sur `jimel-api.octilabs.com`.

Le `Dockerfile` à la racine du repo gère :
1. Build TypeScript
2. Génération du client Prisma
3. Migrations automatiques au démarrage
4. Lancement du serveur

Variables à configurer dans Coolify :
```
DATABASE_URL, JWT_SECRET, PORT, NODE_ENV, CORS_ORIGIN, JWT_EXPIRES_IN
```

**Pre-deploy command dans Coolify :**
```bash
npx prisma migrate deploy
```

## Équipe

| Membre | Rôle |
|---|---|
| Mahamane Ahmad Maiga | Backend — Auth, Users, Connections |
| Yahia Thierno Maiga | Backend — Sessions, Crédits, Chat |