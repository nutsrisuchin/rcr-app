# Migrate Backend Database to PostgreSQL for GCP Cloud Run

Currently, the backend uses a local SQLite database (`database.sqlite`). While this works perfectly for local development, it is not suitable for deployment on Google Cloud Run, which is a stateless environment. If deployed as-is, any saved requests would be lost every time Cloud Run spins up or tears down a container instance.

To solve this, we will transition the backend to support **PostgreSQL**, the industry standard for Cloud Run production environments. We will configure it so that you can continue using SQLite locally without installing any new database software, but it will seamlessly switch to PostgreSQL when deployed to GCP.

## User Review Required

> [!IMPORTANT]
> Since PostgreSQL requires a persistent database server, you will need to create a **Google Cloud SQL (PostgreSQL)** instance in your GCP project before deploying the final app. I will provide you with the exact steps to do this once we finish the code migration.

> [!NOTE]
> Are you comfortable with me updating the backend to automatically use PostgreSQL in production (if a `DATABASE_URL` is provided) while keeping SQLite for your local development?

## Proposed Changes

We will introduce a database wrapper that dynamically switches between `sqlite3` and `pg` (PostgreSQL) depending on the environment variables.

### Backend Updates

#### [MODIFY] `server/package.json`
- Install the `pg` package to allow Node.js to connect to PostgreSQL.

#### [MODIFY] `server/db.js`
- Create a unified database interface.
- If `process.env.DATABASE_URL` is present, initialize a PostgreSQL connection pool.
- If not present, initialize the existing local SQLite database.
- Export standard functions: `queryAll`, `queryGet`, and `queryRun` to abstract away the differences between the two database drivers.
- Ensure the `CREATE TABLE` schema is compatible with both SQLite and PostgreSQL. (e.g., SQLite uses `INTEGER PRIMARY KEY AUTOINCREMENT`, whereas Postgres uses `SERIAL PRIMARY KEY`).

#### [MODIFY] `server/index.js`
- Refactor the existing `db.all`, `db.get`, and `db.run` calls to use the new unified asynchronous functions from `db.js`.
- Update raw SQL queries to be compatible with both databases. For PostgreSQL `INSERT` statements, we need to append `RETURNING id` to capture the newly created ID, and map query parameters (`?`) to PostgreSQL's format (`$1, $2, ...`) dynamically.

## Verification Plan

### Automated Tests
- I will run the local server to verify that SQLite continues to function perfectly for your local development.
- I will perform a mock form submission via the frontend to ensure records are still saved correctly to the local SQLite database.

### Manual Verification
- Once the code is ready, I will provide you with a step-by-step walkthrough on how to:
  1. Create a Cloud SQL instance on GCP.
  2. Set the `DATABASE_URL` environment variable on your Cloud Run service.
  3. Deploy your Docker container.
