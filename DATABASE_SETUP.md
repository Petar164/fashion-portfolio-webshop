# Database Setup Instructions

## Step 1: Create MySQL Database

1. Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line)
2. Create a new database:
   ```sql
   CREATE DATABASE fashionvoid_db;
   ```

## Step 2: Configure Database Connection

1. Create a `.env` file in the root directory (copy from `.env.example` if it exists)
2. Add your database connection string:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/fashionvoid_db"
   ```
   
   Replace:
   - `username` with your MySQL username (usually `root` for local)
   - `password` with your MySQL password
   - `3306` with your MySQL port (default is 3306)
   - `fashionvoid_db` with your database name

3. Add NextAuth configuration:
   ```
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"
   ```
   
   To generate a secure secret, run:
   ```bash
   openssl rand -base64 32
   ```

## Step 3: Generate Prisma Client

```bash
npm run db:generate
```

## Step 4: Run Database Migrations

This will create all the tables in your database:

```bash
npm run db:migrate
```

When prompted, give it a migration name like: `initial_schema`

## Step 5: Seed the Database

This creates the initial admin user:

```bash
npm run db:seed
```

**IMPORTANT**: The default admin credentials are:
- **Email**: `admin@fashionvoid.net`
- **Password**: `admin123`

**⚠️ CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

## Step 6: Start the Development Server

```bash
npm run dev
```

## Access Admin Panel

1. Go to: http://localhost:3000/login
2. Login with the admin credentials above
3. You'll be redirected to the admin dashboard

## Database Schema

The database includes:
- **Users** - Admin and customer accounts
- **Products** - Product listings
- **ProductVariants** - Size/color combinations with inventory
- **Orders** - Customer orders
- **OrderItems** - Items in each order
- **Addresses** - Shipping addresses
- **DiscountCodes** - Promo codes

## Useful Commands

- `npm run db:migrate` - Create new migration
- `npm run db:seed` - Seed database with initial data
- `npm run db:generate` - Generate Prisma Client
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Troubleshooting

If you get connection errors:
1. Make sure MySQL is running
2. Check your DATABASE_URL in `.env`
3. Verify database exists: `SHOW DATABASES;`
4. Check MySQL user permissions

