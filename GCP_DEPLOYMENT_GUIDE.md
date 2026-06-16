# Migration Complete: PostgreSQL for Cloud Run

I have completely refactored your backend server! Your app is now a "dual-engine" application:
1. **Locally:** It continues to use `sqlite3` and writes to the local `database.sqlite` automatically without any configuration needed.
2. **Production:** If it detects a `DATABASE_URL` environment variable, it seamlessly switches over to the `pg` driver and stores everything persistently in a PostgreSQL database.

Below is your step-by-step guide to deploying this directly to Google Cloud Run!

## 1. Create a Cloud SQL Database
To ensure your data is permanently saved, you will need a PostgreSQL database. GCP provides Cloud SQL.

1. Go to the **Google Cloud Console**.
2. Navigate to **SQL** -> **Create Instance** -> **Choose PostgreSQL**.
3. Set your Instance ID, Password, and Region (match the region of your Cloud Run service, e.g., `asia-southeast1`).
4. Once the instance is created, click on it, go to the **Databases** tab, and create a database named `rcrdb`.

## 2. Note Your Connection URL
You need to form a standard PostgreSQL connection URL string that looks like this:
```
postgresql://postgres:YOUR_PASSWORD@/rcrdb?host=/cloudsql/YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_ID
```
*(Replace the uppercase words with your actual password, project ID, region, and SQL instance ID)*

## 3. Deploy to Cloud Run
Since the code is ready, you build and deploy the Docker container exactly like you did before. 

1. **Build and push your image:**
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/rcr-app .
docker push gcr.io/YOUR_PROJECT_ID/rcr-app
```

2. **Deploy to Cloud Run via Console:**
   - Go to Cloud Run -> Create Service.
   - Select the container image you just pushed.
   - **CRITICAL STEP:** Scroll down to the **Variables & Secrets** section. Add a new Environment Variable:
     - **Name:** `DATABASE_URL`
     - **Value:** *[Paste the postgresql:// connection URL you built in Step 2]*
   - Scroll down to the **Connections** tab -> **Cloud SQL connections** -> Add your Cloud SQL instance from the dropdown. This gives Cloud Run the permission to securely talk to your database.
   - Deploy!

> [!TIP]
> The backend will automatically detect the `DATABASE_URL`, create the `requests` table if it doesn't exist, and securely persist all data across container restarts and scale-downs.

Congratulations! Your app is now fully production-ready for GCP!
