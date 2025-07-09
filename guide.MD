# 📘 Full Guide: Deploy Node.js App to Shared Hosting with GitHub Auto-Deploy

## 🧱 Table of Contents

1. [Project Preparation](#1-project-preparation)
2. [GitHub Repository Setup](#2-github-repository-setup)
3. [Shared Hosting Environment Setup (Yegara)](#3-shared-hosting-environment-setup-yegara)
4. [Generate SSH Key for Auto-Deploy](#4-generate-ssh-key-for-auto-deploy)
5. [Connect GitHub to Server (Secrets)](#5-connect-github-to-server-secrets)
6. [Auto-Deploy via GitHub Actions](#6-auto-deploy-via-github-actions)
7. [Environment Setup (`.env`)](#7-environment-setup-env)
8. [MySQL + Sequelize Setup](#8-mysql--sequelize-setup)
9. [Handling App Processes (Node.js)](#9-handling-app-processes-nodejs)
10. [Testing Deployment](#10-testing-deployment)
11. [Debugging & Tips](#11-debugging--tips)

## 1. ✅ Project Preparation on local computers

Ensure your Node.js app is structured correctly:

```
MVetBackend/
├── server.js / index.js
├── package.json
├── .env
├── /routes
├── /models
├── /config
├── /controllers
└── .github/
    └── workflows/
        └── deploy.yml
```

Add necessary scripts to `package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "build": "echo 'build complete'"
}
```

---

## 2. 🗂️ GitHub Repository Setup

```bash
git init
git remote add origin https://github.com/KalayuRedae2016/MoblieVeternarySystem-MVet.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## 3. 🛠 Shared Hosting Environment Setup

1. Login to **cPanel --> Setup Node.js App**
   * Select Node.js version( v20.17+)
   * mode ->production
   * application root directory: mvetApp
   * App root url/path: `/home/YOUR_CPNL_USER/mvetApp`
   * Startup file: `server.js` or `index.js`
---

## 4. 🔐 Generate SSH Key for Auto-Deploy
## Enable SSH Access on the CPanel
## Generate private and public key on local pc
```bash
ssh-keygen -t rsa -b 4096 -C "github-deploy" -f ~/.ssh/yegara_deploy_key
```

**Upload public key to Yegara cPanel:**

* Go to **SSH Access > Manage SSH Keys**
* Click **Import Key**
* Paste contents of `yegara_deploy_key.pub`
* Click **Authorize**

---

## 5. 🔑 Connect GitHub to Server (Secrets)

Go to your GitHub repo → **Settings > Secrets and variables > Actions**

| Name                | Value (example)                                            |
| ------------------- | ---------------------------------------------------------- |
| `SSH_PRIVATE_KEY`   | Paste contents of `yegara_deploy_key`                      |
| `REMOTE_USER`       | Your cPanel username (e.g. `cpaneluser`)                   |
| `REMOTE_HOST`       | `s686.yegara.com`                                          |
| `REMOTE_PATH`       | `/home/cpaneluser/mvetApp`                                   |
| `APP_START_COMMAND` | `npm install && npx sequelize-cli db:migrate && npm start` |

---

## 6. 🚀 Auto-Deploy via GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Mvet deployment to Server

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H ${{ secrets.REMOTE_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to Yegara Server
        run: |
          rsync -avz --exclude='.git' --exclude='node_modules' ./ ${{ secrets.REMOTE_USER }}@${{ secrets.REMOTE_HOST }}:${{ secrets.REMOTE_PATH }}
          ssh ${{ secrets.REMOTE_USER }}@${{ secrets.REMOTE_HOST }} "cd ${{ secrets.REMOTE_PATH }} && ${{ secrets.APP_START_COMMAND }}"
```

Push to deploy:

```bash
git add .
git commit -m "Add deployment workflow"
git push
```

Watch workflow in **GitHub > Actions Tab**.

---

## 7. 📦 Environment Setup (`.env`)

Create `.env`:

```
PORT=3000
DB_HOST=localhost
DB_NAME=mydatabase
DB_USER=myuser
DB_PASS=mypassword
```

Use it in your app:

```js
require('dotenv').config();
```

---

## 8. 🧩 MySQL + Sequelize Setup

Install:

```bash
npm install sequelize mysql2
npm install --save-dev sequelize-cli
```

Initialize Sequelize:

```bash
npx sequelize-cli init
```

Update `config/config.js`:

```js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql"
  }
};
```

Run migrations:

```bash
npx sequelize-cli db:migrate
```

---

## 9. 🔄 Handling App Processes (Node.js)

On shared hosting:

* Use cPanel’s **Node.js App** manager
* Or run manually:

```bash
node app.js
```

Optional: Use `pm2` (if supported)

```bash
npm install -g pm2
pm2 start app.js
```

---

## 10. 🧪 Testing Deployment

1. Push code to GitHub
2. Go to **Actions tab** → View Logs
3. Visit your app:

```
https://yourdomain.com/myapp

---




# Mobile Veternary Services

# 1) Creating Model and Migration for the first time
a) Create new table(Ex:User)
# npx sequelize-cli model:generate --name User --attributes name:string,
# it creates a model/user.js and an migration/xxx-createUser.js migration file
or Create Model using manually
and create miggration using npx sequelize-cli migration:generate --name create-users

b) Run migration
# npx sequelize-cli db:migrate

# 2)  Updating the Model (Adding/Changing Fields) Model and Migration
a) Edit the model with newFields (Ex:adding phoneNumber to user)
   # phoneNumber: {type: DataTypes.STRING,allowNull: true}

b) Create a new migration for this change
# npx sequelize-cli migration:generate --name add-phoneNumber-to-user

c) edit the new generated file:
# // in up()
await queryInterface.addColumn('Users', 'phoneNumber', {
  type: Sequelize.STRING,
  allowNull: true
});
# // in down()
await queryInterface.removeColumn('Users', 'phoneNumber');

d) Run migration
# npx sequelize-cli db:migrate

# 3)  for Mistakes(dev Only)
undo last migrations: npx sequelize-cli db:migrate:undo
undo all migrations: npx sequelize-cli db:migrate:undo:all
edit files and re-run: npx sequelize-cli db:migrate

# Note
1) Model = Defines structure in code (models/)
2) Migration = Applies changes to actual DB (migrations/)
3) Migration files should never be edited once run
4) Always create new migrations for updates
5) Sequelize tracks executed migrations in SequelizeMeta table

