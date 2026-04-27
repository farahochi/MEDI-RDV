# MediRDV Backend

Backend Node.js + Express + PostgreSQL pour gérer:

- authentification patient / docteur
- inscription patient / docteur
- changement de mot de passe
- gestion des rendez-vous
- recherche docteurs / patients
- règles métier demandées

## 1) Prérequis

- Node.js 18 ou plus
- PostgreSQL installé localement
- npm

## 2) Installation PostgreSQL

### Sous Windows (simple)

1. Télécharger PostgreSQL depuis le site officiel PostgreSQL / EDB.
2. Lancer l'installateur.
3. Garder les composants par défaut:
   - PostgreSQL Server
   - pgAdmin
   - Command Line Tools
4. Définir un mot de passe pour l'utilisateur `postgres`.
5. Laisser le port `5432`.
6. Finir l'installation.

## 3) Créer la base

Ouvrir **pgAdmin** ou **psql**, puis créer la base:

```sql
CREATE DATABASE medirdv_db;
```

## 4) Lancer le script SQL

Depuis un terminal:

```bash
psql -U postgres -d medirdv_db -f database/init.sql
```

Ou dans **pgAdmin**:
- ouvrir la base `medirdv_db`
- ouvrir Query Tool
- coller le contenu de `database/init.sql`
- exécuter

## 5) Configuration

Copier `.env.example` en `.env` puis ajuster les valeurs:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=medirdv_db
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=8h
```

## 6) Installation du projet

```bash
npm install
```

## 7) Démarrage

### développement
```bash
npm run dev
```

### normal
```bash
npm start
```

API disponible sur:

```txt
http://localhost:4000/api
```

## 8) Comptes de test injectés par le script SQL

### Patient
- email: `patient@medirdv.tn`
- mot de passe: `patient123`

### Docteur
- email: `doctor@medirdv.tn`
- mot de passe: `doctor123`

## 9) Principales routes

### Auth
- `POST /api/auth/register/patient`
- `POST /api/auth/register/doctor`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/reset-password`

### Docteurs
- `GET /api/public/doctors`
- `GET /api/doctors`

### Patients
- `GET /api/patients`

### Rendez-vous
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id`
- `PATCH /api/appointments/:id/status`
- `DELETE /api/appointments/:id`

## 10) Règles métier implémentées

### Patient
- peut consulter ses rendez-vous
- peut créer un nouveau rendez-vous
- peut modifier un rendez-vous seulement si la date du rendez-vous n'est pas aujourd'hui
- peut annuler un rendez-vous sauf s'il est **confirmé** et que sa date est **aujourd'hui**

### Docteur
- peut consulter les rendez-vous de ses patients
- peut modifier la date / heure / motif / notes d'un rendez-vous
- peut confirmer ou rejeter un rendez-vous
