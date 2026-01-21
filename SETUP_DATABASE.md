# Quick Database Setup for Laragon

## Step 1: Create the Database

1. Open **phpMyAdmin** in Laragon (click "Database" button or go to http://localhost/phpmyadmin)
2. Click "New" to create a new database
3. Database name: `fashionvoid_db`
4. Collation: `utf8mb4_unicode_ci` (or leave default)
5. Click "Create"

## Step 2: Update .env File

Your `.env` file needs the correct MySQL credentials. For Laragon, typically:

```
DATABASE_URL="mysql://root@localhost:3306/fashionvoid_db"
```

**OR if Laragon has a password set:**

```
DATABASE_URL="mysql://root:yourpassword@localhost:3306/fashionvoid_db"
```

**Common Laragon MySQL settings:**
- Username: `root`
- Password: (usually empty, but check your Laragon MySQL settings)
- Host: `localhost`
- Port: `3306`
- Database: `fashionvoid_db`

## Step 3: Test Connection

After updating `.env`, restart your dev server and try logging in again.

## Step 4: Run Migrations

Once the connection works, create the tables:

```bash
npm run db:migrate
```

When prompted, name it: `initial_schema`

## Step 5: Seed Admin User

```bash
npm run db:seed
```

This creates the admin user with email: `fashionvoidhelp@gmail.com` and password: `admin123`

## Troubleshooting

**If connection still fails:**
1. Make sure MySQL is running in Laragon (green icon)
2. Check if MySQL has a password set in Laragon settings
3. Try connecting with phpMyAdmin first to verify credentials
4. Check the terminal/console for detailed error messages

