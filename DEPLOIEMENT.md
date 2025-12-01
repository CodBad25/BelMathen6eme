# Guide de Déploiement - Maths 4e

## ✅ Base de données Neon configurée

Votre base de données PostgreSQL est déjà initialisée sur Neon avec toutes les tables nécessaires.

**Connection string** :
```
postgresql://neondb_owner:npg_SsInRCzOY98T@ep-delicate-fog-abbsglmc-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

---

## 🚀 Options de déploiement

### Option 1 : Railway (Recommandé)

**Avantages** : Déploiement automatique, gratuit pour commencer, très simple

1. Créez un compte sur https://railway.app
2. Cliquez sur "New Project" → "Deploy from GitHub repo"
3. Connectez votre repository GitHub
4. Ajoutez les variables d'environnement (voir ci-dessous)
5. Railway déploiera automatiquement !

### Option 2 : Render

**Avantages** : Plan gratuit généreux, excellent support PostgreSQL

1. Créez un compte sur https://render.com
2. Cliquez sur "New +" → "Web Service"
3. Connectez votre repository GitHub
4. Configurez :
   - **Build Command** : `pnpm install && pnpm build`
   - **Start Command** : `pnpm start`
5. Ajoutez les variables d'environnement

### Option 3 : VPS (DigitalOcean, AWS, etc.)

Pour un serveur dédié, suivez ces étapes :

```bash
# 1. Cloner le projet
git clone votre-repo
cd maths-4e

# 2. Installer les dépendances
pnpm install

# 3. Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Build
pnpm build

# 5. Lancer avec PM2
npm install -g pm2
pm2 start dist/index.js --name maths-4e
pm2 save
pm2 startup
```

---

## 🔐 Variables d'environnement requises

Créez un fichier `.env` avec ces variables :

```env
# Base de données Neon
DATABASE_URL=postgresql://neondb_owner:npg_SsInRCzOY98T@ep-delicate-fog-abbsglmc-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Sécurité (générez un secret aléatoire)
JWT_SECRET=votre_secret_jwt_aleatoire_ici

# OAuth Manus (si vous voulez garder l'authentification Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=votre_app_id

# Propriétaire (admin par défaut)
OWNER_OPEN_ID=votre_email@example.com
OWNER_NAME=Votre Nom

# Configuration de l'application
VITE_APP_TITLE=Mathématiques 4e - Collège André Dulin
VITE_APP_LOGO=/logo.svg
NODE_ENV=production
PORT=3000
```

### Générer un JWT_SECRET sécurisé :

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Ou en Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📦 Structure du projet

```
maths-4e/
├── client/          # Frontend React + Vite
├── server/          # Backend Express + tRPC
├── drizzle/         # Schéma de base de données
├── dist/            # Build de production (généré)
├── package.json
└── .env             # Variables d'environnement (à créer)
```

---

## 🔧 Commandes utiles

```bash
# Développement local
pnpm dev

# Build de production
pnpm build

# Lancer en production
pnpm start

# Tests
pnpm test

# Mise à jour du schéma DB
pnpm db:push
```

---

## ⚠️ Important

1. **Ne commitez JAMAIS le fichier `.env`** dans Git
2. Ajoutez `.env` dans votre `.gitignore`
3. Changez le `JWT_SECRET` en production
4. Activez SSL pour la connexion à la base de données

---

## 📞 Support

Pour toute question sur le déploiement, consultez la documentation de la plateforme choisie :
- Railway : https://docs.railway.app
- Render : https://render.com/docs
- Neon : https://neon.tech/docs

