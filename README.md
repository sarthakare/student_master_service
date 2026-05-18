# Student Master Service

Node.js workspace for PostgreSQL-backed student registry data. The database layer uses [`pg`](https://node-postgres.com/) with a connection string from environment variables.

## Prerequisites

- [Node.js](https://nodejs.org/) (matching your local setup)
- A PostgreSQL instance and a **`DATABASE_URL`** connection string

## Setup

```bash
npm install
```

## Environment variables

Create a **`.env`** file in the project root (do not commit real credentials). Variables used so far:

| Variable        | Purpose |
|----------------|---------|
| `DATABASE_URL` | Full PostgreSQL connection URI (required for `db.js` and migration script). Example shape: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` |
| `PORT`        | Intended for HTTP server usage (referenced in commented examples only until `server.js` is implemented). |

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
- Uses **`ssl: { rejectUnauthorized: false }`**, typical for hosted PostgreSQL that requires TLS without a custom CA (e.g. some cloud providers). Tighten this for strict production setups if your provider documents a trusted CA bundle.

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
| `server.js` | Placeholder / not yet wired (empty) |
| `import.js` | Placeholder (empty) |

## NPM scripts

| Script | Command |
|--------|---------|
| `db:create-student-master` | `node createStudentMasterTable.js` |

## Dependencies (installed)

Includes **`pg`**, **`dotenv`**, **`express`**, **`cors`**, **`csv-parser`** for upcoming API or import workflows.

---

## Changelog (documentation scope)

- **Database:** `student_master` table with enrollment-driven primary key and idempotent creation (SQL + migration script checks).
