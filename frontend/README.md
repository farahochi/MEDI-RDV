# MediRDV Frontend

Frontend HTML / CSS / JavaScript connecté au backend Express/PostgreSQL.

## Pages fournies

- `index.html` : accueil + recherche publique de docteurs
- `login.html` : connexion patient / docteur
- `signup.html` : inscription patient / docteur
- `patient-dashboard.html` : espace patient
- `doctor-dashboard.html` : espace docteur
- `reset-password.html` : changement de mot de passe

## Configuration API

Le frontend consomme l'API via `js/config.js`:

```js
export const API_BASE_URL = "http://localhost:4000/api";
```

Si besoin, changer cette URL.

## Lancement

### Option 1 — VS Code + Live Server
- ouvrir le dossier `frontend-medirdv`
- clic droit sur `index.html`
- `Open with Live Server`

### Option 2 — Python
Dans le dossier frontend:

```bash
python -m http.server 5500
```

Puis ouvrir:

```txt
http://localhost:5500
```

## Comptes de test

Créés par le script SQL du backend:

### Patient
- email: `patient@medirdv.tn`
- mot de passe: `patient123`

### Docteur
- email: `doctor@medirdv.tn`
- mot de passe: `doctor123`
