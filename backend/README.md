# Projet Back-end St Jude  

Un projet Node.js avec **Express**, **TypeScript** et **Mongoose (MongoDB)** pour gérer :  
- Utilisateurs (Users)  
- Marchandises (Goods)  
- Réservations (Reservations)  
- Voyages (Trips)  
- Bateaux (Boats)  
- Mouvements de caisse (CashMovements)  
- Consommation de carburant (FuelConsumptions)  

---

##  Installation

### 1. Cloner le projet
```bash
git clone https://github.com/ton-compte/back-stJude.git
cd back-stJude
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer le projet en développement
```bash
npm run dev
```

Le serveur tourne sur 👉 [http://localhost:3000](http://localhost:3000)  

### 4. Compiler et lancer en production
```bash
npm run build
npm start
```

---

## 📂 Structure du projet
```
back-stJude/
│── src/
│   ├── config/          # Connexion MongoDB
│   │   └── db.ts
│   ├── models/          # Schémas Mongoose (User, Goods, ...)
│   ├── controllers/     # Logique métier
│   ├── routes/          # Routes Express
│   ├── app.ts           # Configuration Express
│   └── server.ts        # Point d'entrée serveur
│── dist/                # Code compilé (après build)
│── .env                 # Variables d'environnement
│── tsconfig.json        # Config TypeScript
│── package.json
│── README.md
```

---

## 🛠️ Technologies utilisées
- [Node.js](https://nodejs.org/)  
- [Express](https://expressjs.com/)  
- [TypeScript](https://www.typescriptlang.org/)  
- [MongoDB](https://www.mongodb.com/) avec [Mongoose](https://mongoosejs.com/)  
- [dotenv](https://www.npmjs.com/package/dotenv) pour la configuration  
- [cors](https://www.npmjs.com/package/cors) pour les requêtes cross-origin  

---

👉 Les autres entités (`Goods`, `Reservation`, `Trip`, `Boat`, `CashMovement`, `FuelConsumption`) auront une structure similaire.

---

## ✅ Roadmap
- [x] Base du projet (Express + TS + Mongoose)  
- [ ] CRUD User  
- [x] CRUD Goods  
- [x] CRUD Reservation  
- [x] CRUD Trip  
- [x] CRUD Boat  
- [x] CRUD CashMovement  
- [x] CRUD FuelConsumption  
- [ ] Authentification JWT  

---  
