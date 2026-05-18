# Student Master API

Base URL (production):

```text
http://194.238.16.62:5001
```

All endpoints return **JSON**. CORS is enabled for browser clients.

---

## Data model

Each row in `student_master` represents one student record for a given **semester** and **session**. The same enrollment number can appear more than once (e.g. semester 1 and semester 2).

| Field            | Type   | Required | Description                          |
|------------------|--------|----------|--------------------------------------|
| `enrollment_no`  | string | Yes      | Unique student enrollment ID         |
| `name`           | string | Yes      | Full name                            |
| `faculty`        | string | Yes      | Faculty name                         |
| `programme`      | string | Yes      | Programme / degree name              |
| `semester`       | string | Yes      | Semester (e.g. `"1"`, `"2"`)         |
| `session`        | string | Yes      | Academic session (e.g. `"2025-29"`)  |

**Primary key:** `(enrollment_no, semester, session)` — duplicate combinations on insert will fail unless handled by your client.

---

## Endpoints

### 1. List students (paginated)

```http
GET /students
```

**Query parameters**

| Parameter | Default | Description                    |
|-----------|---------|--------------------------------|
| `page`    | `1`     | Page number (1-based)          |
| `limit`   | `50`    | Max rows per page              |

**Example**

```http
GET http://194.238.16.62:5001/students
GET http://194.238.16.62:5001/students?page=1&limit=10
GET http://194.238.16.62:5001/students?page=2&limit=50
```

**Response:** `200 OK` — array of student objects.

```json
[
  {
    "enrollment_no": "ADTU/0/2025-29/BTCS/001",
    "name": "LALFAKAWMA RALTE",
    "faculty": "Faculty of Computer Technology",
    "programme": "B.Tech in Computer Science and Engineering",
    "semester": "1",
    "session": "2025-29"
  }
]
```

---

### 2. Create a student

```http
POST /students
Content-Type: application/json
```

**Body (JSON)**

```json
{
  "enrollment_no": "ADTU/0/2025-29/BTCS/099",
  "name": "Test Student",
  "faculty": "Faculty of Computer Technology",
  "programme": "B.Tech in Computer Science and Engineering",
  "semester": "1",
  "session": "2025-29"
}
```

All six fields are required.

**Example (curl)**

```bash
curl -X POST http://194.238.16.62:5001/students \
  -H "Content-Type: application/json" \
  -d "{\"enrollment_no\":\"ADTU/0/2025-29/BTCS/099\",\"name\":\"Test Student\",\"faculty\":\"Faculty of Computer Technology\",\"programme\":\"B.Tech in Computer Science and Engineering\",\"semester\":\"1\",\"session\":\"2025-29\"}"
```

**Response:** `200 OK` — the created row.

```json
{
  "enrollment_no": "ADTU/0/2025-29/BTCS/099",
  "name": "Test Student",
  "faculty": "Faculty of Computer Technology",
  "programme": "B.Tech in Computer Science and Engineering",
  "semester": "1",
  "session": "2025-29"
}
```

**Note:** Inserting the same `(enrollment_no, semester, session)` again returns a database error (duplicate key).

---

### 3. Filter by semester and faculty

```http
GET /students/filter
```

**Query parameters (both required)**

| Parameter  | Description        |
|------------|--------------------|
| `semester` | Semester value     |
| `faculty`  | Exact faculty name |

**Example**

```http
GET http://194.238.16.62:5001/students/filter?semester=1&faculty=Faculty%20of%20Computer%20Technology
```

Spaces and special characters in query values must be **URL-encoded** (`Faculty of Computer Technology` → `Faculty%20of%20Computer%20Technology`).

**Response:** `200 OK` — array of matching students.

---

### 4. Get all rows for one enrollment number

```http
GET /students/{enrollment_no}
```

Returns every semester/session row for that enrollment, ordered by `semester`.

**Important:** Enrollment IDs contain `/` (e.g. `ADTU/0/2025-29/BTCS/001`). Encode slashes in the URL path:

| Raw enrollment              | Encoded path segment              |
|----------------------------|-----------------------------------|
| `ADTU/0/2025-29/BTCS/001`  | `ADTU%2F0%2F2025-29%2FBTCS%2F001` |

**Example**

```http
GET http://194.238.16.62:5001/students/ADTU%2F0%2F2025-29%2FBTCS%2F001
```

**JavaScript**

```js
const enrollment = "ADTU/0/2025-29/BTCS/001";
const url = `http://194.238.16.62:5001/students/${encodeURIComponent(enrollment)}`;
const res = await fetch(url);
const rows = await res.json();
```

**Response:** `200 OK` — array (often multiple rows for different semesters).

```json
[
  {
    "enrollment_no": "ADTU/0/2025-29/BTCS/001",
    "name": "LALFAKAWMA RALTE",
    "faculty": "Faculty of Computer Technology",
    "programme": "B.Tech in Computer Science and Engineering",
    "semester": "1",
    "session": "2025-29"
  },
  {
    "enrollment_no": "ADTU/0/2025-29/BTCS/001",
    "name": "LALFAKAWMA RALTE",
    "faculty": "Faculty of Computer Technology",
    "programme": "B.Tech in Computer Science and Engineering",
    "semester": "2",
    "session": "2025-29"
  }
]
```

---

## Postman quick setup

1. Create a collection with base URL: `http://194.238.16.62:5001`
2. **GET** `{{baseUrl}}/students`
3. **POST** `{{baseUrl}}/students` → Body → raw → JSON (see create example above)
4. **GET** `{{baseUrl}}/students/filter?semester=1&faculty=Faculty of Computer Technology`
5. **GET** `{{baseUrl}}/students/ADTU%2F0%2F2025-29%2FBTCS%2F001`

---

## Frontend (fetch) examples

**List students**

```js
const response = await fetch("http://194.238.16.62:5001/students?page=1&limit=50");
const students = await response.json();
```

**Create student**

```js
const response = await fetch("http://194.238.16.62:5001/students", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    enrollment_no: "ADTU/0/2025-29/BTCS/099",
    name: "Test Student",
    faculty: "Faculty of Computer Technology",
    programme: "B.Tech in Computer Science and Engineering",
    semester: "1",
    session: "2025-29",
  }),
});
const created = await response.json();
```

**Filter**

```js
const params = new URLSearchParams({
  semester: "1",
  faculty: "Faculty of Computer Technology",
});
const response = await fetch(
  `http://194.238.16.62:5001/students/filter?${params}`,
);
const students = await response.json();
```

---

## Bulk import (server only, not HTTP)

To load many rows from CSV on the VPS:

```bash
cd /var/www/student_master_service
npm run import:students
```

Requires `students.csv` in the project folder. See `import.js` for CSV column format.

---

## Errors

| Situation              | Typical result                          |
|------------------------|-----------------------------------------|
| Server down            | Connection refused / timeout            |
| Duplicate primary key  | `500` with database error in logs       |
| Missing POST fields    | `500` or incomplete insert              |
| Filter missing params  | Query may return empty or unexpected rows |

There is no authentication on the API yet. Do not expose sensitive operations publicly without adding auth.

---

## HTTPS and domain (future)

When you add a domain and SSL, replace the base URL only:

```text
https://api.yourdomain.com
```

Endpoint paths stay the same (`/students`, `/students/filter`, etc.).

---

## Summary

| Method | Path                    | Purpose                          |
|--------|-------------------------|----------------------------------|
| GET    | `/students`             | Paginated list                   |
| POST   | `/students`             | Create one student               |
| GET    | `/students/filter`      | Filter by `semester` + `faculty` |
| GET    | `/students/{enrollment}`| All rows for one enrollment      |

**Base URL:** `http://194.238.16.62:5001`
