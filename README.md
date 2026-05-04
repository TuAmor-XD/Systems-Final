# Belize Holidays API 2026

A read-only REST API serving official Belize public and bank holidays for 2026.
Source: Government of Belize Press Release PR#218-25, November 6 2025.

## Setup

### 1. Create the Postgres database
```sql
CREATE USER holidays_user WITH PASSWORD 'secret';
CREATE DATABASE holidays_db OWNER holidays_user;
```

### 2. Run the migration (creates table AND seeds all 14 holidays)
```bash
psql -U holidays_user -d holidays_db -f migrations/000001_create_holidays_table.up.sql
```

### Content check
``` bash
sudo -u postgres psql -d holidays_db
\dt
SELECT * FROM holidays;
```

### 3. Run the server
```bash
go mod tidy
go run ./main.go
```
Server starts on **:4000**.

### 4. Open the UI
Open `http://localhost:4000` in your browser — the server now serves both the API and the UI.

---

## Endpoints (all GET, read-only)

| Endpoint                     | Description                                      |
|------------------------------|--------------------------------------------------|
| `GET /holidays/month/current`| Holidays in the current calendar month           |
| `GET /holidays/month/next`   | Holidays in the next calendar month              |
| `GET /holidays/occasions`    | List of all occasion names                       |
| `GET /holidays/dates`        | List of all holiday dates                        |
| `GET /holidays/days`         | List of all holiday weekday names                |
| `GET /holidays/today`        | Is today a holiday? Returns message + occasion   |
| `GET /holidays/next`         | Next upcoming holiday after today                |
| `GET /holidays/year/{year}`  | All holidays for a year (2026 only)              |

---

## Example curl commands

```bash
# Is today a holiday?
curl -i -X GET http://localhost:4000/holidays/today

# Holidays this month
curl -i -X GET http://localhost:4000/holidays/month/current

# Holidays next month
curl -i -X GET http://localhost:4000/holidays/month/next

# Next holiday coming up
curl -i -X GET http://localhost:4000/holidays/next

# All occasions
curl -i -X GET http://localhost:4000/holidays/occasions

# All dates
curl -i -X GET http://localhost:4000/holidays/dates

# All days
curl -i -X GET http://localhost:4000/holidays/days

# All holidays for 2026
curl -i -X GET http://localhost:4000/holidays/year/2026

# Try a year we don't have — returns a 400
curl -i -X GET http://localhost:4000/holidays/year/2025
```
# Systems-Final
