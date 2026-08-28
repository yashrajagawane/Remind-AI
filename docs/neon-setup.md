# Neon PostgreSQL Setup Guide for ReMind AI

This guide explains how to provision and configure a Neon serverless PostgreSQL database for the ReMind AI project.

> [!NOTE]
> Local development works perfectly fine with the default SQLite database. You only need to set up Neon PostgreSQL for staging or production environments.

## 1. Create a Neon Account
1. Go to [Neon.tech](https://neon.tech) and sign up for an account.
2. The free tier is sufficient for initial development and staging.

## 2. Create a Project
1. Once logged in, click **Create Project**.
2. **Name:** `remind-ai`
3. **Postgres Version:** Choose the latest default version.
4. **Region:** Select the region closest to India (e.g., `Asia Pacific (Singapore) - ap-southeast-1`).
5. Click **Create Project**.

## 3. Get the Connection String
After creating the project, you will be presented with a connection string. It will look similar to this:
```bash
postgresql://<user>:<password>@<host>.neon.tech/neondb?sslmode=require
```
Copy this entire string. You can retrieve it at any time from the Neon Dashboard under **Connection Details**.

## 4. Configure the Project
Update your environment variables to connect to Neon PostgreSQL.

1. Open your `.env` file (refer to `.env.example` if you need to create one).
2. Set the `DATABASE_URL` variable to your Neon connection string:
```bash
DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/neondb?sslmode=require"
```
*(If `DATABASE_URL` is omitted or empty, the application will automatically fall back to using local SQLite.)*

## 5. Run Migrations
Initialize your Neon database schema by running the Alembic migrations.

```bash
cd backend
alembic upgrade head
```

## 6. Run the Seed Script
Populate your database with initial data using the seed script.

```bash
cd backend
python -m scripts.seed
```
*(Alternatively: `python ../scripts/seed.py` depending on your working directory.)*

## 7. Verify the Setup
You can verify that the tables and data were created successfully by:
- Using the **SQL Editor** built into the Neon Dashboard.
- Connecting via a local SQL client (like `psql`, pgAdmin, or DBeaver) using your connection string.

## 8. Free Tier Limits
Be aware of Neon's free tier limitations:
- **Storage:** 0.5 GB maximum
- **Projects:** 1 project per account
- **Compute:** 100 hours per month
- **Autosuspend:** The database will automatically scale to zero (suspend) after 5 minutes of inactivity. The first query after suspension might take a few seconds longer to execute (cold start).

## 9. Troubleshooting

### SSL Errors
If you encounter SSL connection issues, make sure `?sslmode=require` is appended to the end of your `DATABASE_URL`.

### Connection Timeouts
Because the database auto-suspends after 5 minutes of inactivity, the first connection after a break might time out. If this happens, simply retry the operation (or restart your FastAPI server).

### IP Allowlisting
By default, Neon allows connections from any IP. If you've modified project settings to restrict IP access, ensure your current IP address (development machine or production server) is added to the allowlist.
