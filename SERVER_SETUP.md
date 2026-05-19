# Student Master Service — Server Setup & Deployment

This guide covers first-time setup on a server (Linux/VPS), loading data from `students.xlsx`, and running the API with **PM2**.

---

## Prerequisites

- **Node.js** 18+ (`node -v`)
- **npm** (`npm -v`)
- **MongoDB** — Atlas cluster or self-hosted instance
- **PM2** (process manager for production)

---

## 1. Clone / copy project to the server

```bash
cd /var/www   # or your preferred directory
git clone <your-repo-url> student_master_service
cd student_master_service
```

If you copy files manually, ensure `students.xlsx` is in the project root (same folder as `import.js`).

---

## 2. Set `MONGODB_URI` in `.env`

Create `.env` in the project root (copy from `.env.example`):

```bash
cp .env.example .env
nano .env
```

Example (replace placeholders with your Atlas values):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/student_master?retryWrites=true&w=majority
PORT=5002
```

**Important**

- Include the **database name** in the URI (e.g. `/student_master`).
- On **MongoDB Atlas**: Database Access (user/password) and Network Access (allow server IP).
- Do **not** commit `.env` to git.

---

## 3. Install dependencies

```bash
npm install
```

Use `npm ci` in CI/CD if you deploy from a lockfile.

---

## 4. Create database indexes (run once)

```bash
npm run db:ensure-indexes
```

Expected output:

```text
Indexes ensured on students collection.
```

Run again after a fresh database; it is safe and idempotent.

---

## 5. Upload data from `students.xlsx`

Place `students.xlsx` in the project root, then:

```bash
npm run import:students
```

This upserts all rows into the `students` collection. Re-running updates existing records (no duplicates for the same enrollment + semester + session).

Verify connection (optional):

```bash
node test.js
```

Expected: `MongoDB ping: { ok: 1 }`

---

## 6. Run the API

### Development (local, auto-reload)

```bash
npm run dev
```

Uses **nodemon**. API: `http://localhost:5002` (or your `PORT`).

### Production with PM2

#### Install PM2 globally (once per server)

```bash
sudo npm install -g pm2
```

#### Start the app

From the project root:

```bash
pm2 start ecosystem.config.js
```

Or using npm:

```bash
npm run pm2:start
```

#### Useful PM2 commands

| Command | Description |
|---------|-------------|
| `pm2 status` | List running apps |
| `pm2 logs student-master-service` | View logs |
| `pm2 restart student-master-service` | Restart after code/env change |
| `pm2 stop student-master-service` | Stop the app |
| `pm2 delete student-master-service` | Remove from PM2 |
| `pm2 save` | Save process list |
| `pm2 startup` | Generate command to start PM2 on boot |

After `pm2 startup`, run the command it prints, then:

```bash
pm2 save
```

---

## 7. API endpoints

Base URL: `http://<server-ip>:5002` (or behind nginx on port 80/443)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/students?page=1&limit=50` | Paginated list |
| `GET` | `/students/filter?semester=2&faculty=...` | Filter by semester and faculty |
| `GET` | `/students/:enrollment` | All rows for one enrollment number |
| `POST` | `/students` | Create or update one student row (JSON body) |

**POST example**

```json
{
  "enrollment_no": "ADTU/0/2025-29/BTCS/001",
  "name": "LALFAKAWMA RALTE",
  "faculty": "Faculty of Computer Technology",
  "programme": "B.Tech in Computer Science and Engineering",
  "semester": "2",
  "session": "2025-29"
}
```

Extra fields in the body are stored on the document (flexible schema).

---

## Quick reference — full first-time setup

```bash
# 1. Env
cp .env.example .env
# Edit .env → set MONGODB_URI and PORT

# 2. Dependencies
npm install

# 3. Indexes
npm run db:ensure-indexes

# 4. Import Excel
npm run import:students

# 5. Production (PM2)
pm2 start ecosystem.config.js
pm2 save
```

---

## Updating the app on the server

```bash
cd /path/to/student_master_service
git pull
npm install
pm2 restart student-master-service
```

If you changed `students.xlsx`:

```bash
npm run import:students
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MONGODB_URI is not set` | Create `.env` with `MONGODB_URI`; restart PM2 after changes |
| `ECONNREFUSED` / `querySrv` | Check Atlas IP whitelist, URI, internet/DNS on server |
| `Authentication failed` | Verify Atlas user/password in URI |
| Import: 0 rows | Ensure `students.xlsx` is in project root with header row |
| PM2 app crashes on start | `pm2 logs student-master-service`; confirm `.env` is in project root |
| Port in use | Change `PORT` in `.env` or stop the other process |

---

## Files reference

| File | Purpose |
|------|---------|
| `.env` | Secrets (`MONGODB_URI`, `PORT`) — not in git |
| `students.xlsx` | Source data for import |
| `ecosystem.config.js` | PM2 configuration |
| `server.js` | Express API |
| `import.js` | Excel → MongoDB import |
| `scripts/ensureIndexes.js` | Creates MongoDB indexes |
