# Student Master Service

Node.js workspace for PostgreSQL-backed student registry data. The database layer uses [`pg`](https://node-postgres.com/) with a connection string from environment variables.

## Prerequisites

- [Node.js](https://nodejs.org/) (matching your local setup)
- A PostgreSQL instance and a **`DATABASE_URL`** connection string

## Setup

```bash
npm install
```

## Run the server

### Local development

Create `.env` (see [Environment variables](#environment-variables)), then:

```bash
npm run dev
```

Or without auto-reload:

```bash
npm start
```

Default URL: `http://localhost:5001` (or the `PORT` in `.env`).

### Production (VPS with PM2)

```bash
cd /var/www/student_master_service
pm2 start server.js --name student-master
pm2 save
```

Restart after code or env changes:

```bash
pm2 restart student-master
```

Check logs:

```bash
pm2 logs student-master --lines 50
```

Live API base URL (example): `http://194.238.16.62:5001` — see **[API.md](./API.md)** for endpoints.

---

## Deploy and update from GitHub

Repository: **https://github.com/sarthakare/student_master_service**

### First time on the VPS

```bash
cd /var/www
git clone https://github.com/sarthakare/student_master_service.git
cd student_master_service
npm install
```

Create `.env` on the server (do not commit this file):

```env
PORT=5001
DATABASE_URL=postgresql://student_app:YOUR_PASSWORD@127.0.0.1:5432/student_master_db
DATABASE_SSL=false
```

Create the table and verify the database:

```bash
npm run db:create-student-master
node test.js
```

Start with PM2:

```bash
pm2 start server.js --name student-master
pm2 save
pm2 startup
```

Open port **5001** in `ufw` and the Hostinger VPS firewall if you need access from outside.

### Pull latest code and redeploy

SSH into the server, then:

```bash
cd /var/www/student_master_service
git pull origin main
npm install
pm2 restart student-master
```

If your default branch is `master` instead of `main`:

```bash
git pull origin master
```

After schema changes, run migrations if documented in the repo, for example:

```bash
npm run db:create-student-master
# npm run db:migrate-student-master-key   # only when needed
```

To reload CSV data on the server:

```bash
npm run import:students
```

### If the folder was copied without Git

Initialize once, then use `git pull` as above:

```bash
cd /var/www/student_master_service
git init
git remote add origin https://github.com/sarthakare/student_master_service.git
git fetch origin
git checkout -b main origin/main
```

---

## Environment variables

Create a **`.env`** file in the project root (do not commit real credentials). Variables used so far:

| Variable        | Purpose |
|----------------|---------|
| `DATABASE_URL` | Full PostgreSQL connection URI (required for `db.js` and migration script). Example shape: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` |
| `PORT`         | HTTP port for `server.js` (default `5001`). |
| `DATABASE_SSL` | Set to `true` for cloud Postgres (e.g. Render); `false` for local/VPS Postgres. |

**Security:** `.env` must stay out of version control. Use secrets management or your host’s env configuration in deployment.

### Local PostgreSQL (optional split variables)

Older commented snippets in `.env` may list `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`. The running code expects **`DATABASE_URL`**; build that URL yourself or use your platform’s Postgres URL.

## Database schema: `student_master`

Defined in **`sql/student_master.sql`**. Maps spreadsheet-style columns to SQL names and types:

| Logical field   | Column           | Type            | Constraints |
|-----------------|------------------|-----------------|-------------|
| Enrollment No   | `enrollment_no` | `VARCHAR(50)`   | `PRIMARY KEY` |
| Name            | `name`          | `VARCHAR(255)`  | `NOT NULL` |
| Faculty         | `faculty`       | `VARCHAR(255)`  | `NOT NULL` |
| Programme       | `programme`     | `VARCHAR(255)`  | `NOT NULL` |
| Semester        | `semester`      | `VARCHAR(50)`   | nullable |
| Session         | `session`       | `VARCHAR(50)`   | nullable |

- **`CREATE TABLE IF NOT EXISTS`** makes the DDL safe to rerun in **`psql`** or other clients without failing if the table already exists.

## Creating the table (migration)

Script: **`createStudentMasterTable.js`**

1. Loads **`.env`** via **`db.js`**.
2. Queries **`information_schema`**: if `student_master` already exists in the current schema, prints a skip message and **does not** re-run DDL.
3. Otherwise executes **`sql/student_master.sql`**.

```bash
npm run db:create-student-master
```

Equivalent:

```bash
node createStudentMasterTable.js
```

### Running DDL only with psql

```bash
psql "YOUR_DATABASE_URL" -f sql/student_master.sql
```

(On Windows PowerShell, ensure the URL is quoted.)

## Connection module: `db.js`

- Builds a **`pg.Pool`** from **`process.env.DATABASE_URL`**.
- Enables SSL only when **`DATABASE_SSL=true`** (cloud hosts). Local/VPS Postgres should use **`DATABASE_SSL=false`**.

Require it from other scripts:

```js
const pool = require("./db");
```

## Sanity check: database time

**`test.js`** runs `SELECT NOW()` through the pool to verify connectivity:

```bash
node test.js
```

## Project layout (current)

| Path | Role |
|------|------|
| `db.js` | Shared `pg` pool |
| `createStudentMasterTable.js` | Idempotent table creation (script) |
| `sql/student_master.sql` | `student_master` DDL |
| `test.js` | Quick DB connectivity test |
| `server.js` | Express API (`GET`/`POST` `/students`, etc.) |
| `import.js` | CSV import into `student_master` |
| `API.md` | HTTP API documentation |

## NPM scripts

| Script | Command |
|--------|---------|
| `start` | `node server.js` |
| `dev` | `nodemon server.js` |
| `db:create-student-master` | `node createStudentMasterTable.js` |
| `import:students` | `node import.js` |

## Dependencies (installed)

Includes **`pg`**, **`dotenv`**, **`express`**, **`cors`**, **`csv-parser`** for upcoming API or import workflows.

---

## Changelog (documentation scope)

- **Database:** `student_master` table with enrollment-driven primary key and idempotent creation (SQL + migration script checks).
