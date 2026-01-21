# FashionVoid - Full-Stack E-Commerce Platform

A modern, production-ready e-commerce webshop built with Next.js 14, React, TypeScript, and Framer Motion. Features a comprehensive admin dashboard, secure user authentication, product management, shopping cart, wishlist, order processing, and payment integration.

## 🚀 Live Demo

- **Production Site:** [fashionvoid.net](https://www.fashionvoid.net) *(if applicable)*
- **Demo Video:** *Add link to video walkthrough*

## ✨ Key Features

### E-Commerce Functionality
- Complete product catalog with image galleries
- Shopping cart with persistent state
- Secure checkout flow with address management
- Order history and tracking
- Wishlist functionality
- Featured products system (up to 4)
- Product variants (sizes, colors) with inventory management

### Admin Dashboard
- Full product CRUD operations
- Image upload and management via Cloudinary
- Inventory management
- Order management and tracking
- User management system
- Discount code management
- Analytics dashboard

### User Features
- Secure authentication with NextAuth.js
- User profiles with avatar upload
- Purchase history
- Wishlist management
- Profile customization

### Payment Integration
- Stripe payment processing
- PayPal integration
- Secure webhook handling
- Order confirmation emails

### Technical Features
- Server-side rendering with Next.js 14
- Type-safe API routes
- Database migrations with Prisma
- Responsive mobile-first design
- Smooth animations with Framer Motion
- Dark theme UI

## Features

✨ **Immersive Animations**
- Smooth page transitions with Framer Motion
- Animated product cards with hover effects
- Interactive shopping cart with slide-in animations
- Beautiful galaxy-themed start screen

🛍️ **E-commerce Features**
- Product listing and detail pages with scrollable image galleries
- Shopping cart with quantity management
- Size and color selection for products
- Featured products section (max 3)
- Wishlist functionality
- Order history for customers

👤 **User Management**
- User authentication (NextAuth.js)
- Role-based access (Admin/Customer)
- Profile management with purchase history
- Secure password hashing

📦 **Admin Dashboard**
- Add/Edit/Delete products
- Direct image upload via Cloudinary
- Featured product management (3 max)
- Product variant management (sizes, colors, inventory)

💳 **Checkout**
- Dark-themed checkout page
- Order summary
- Address management
- Coming soon page for payments

🎨 **Modern Design**
- Fully responsive (mobile-first approach)
- Dark theme with white accents
- Smooth animations throughout
- Touch-optimized for mobile

## Getting Started on a New PC

### Prerequisites

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **MySQL** database server (or use Laragon/XAMPP/WAMP)
- **Git** installed
- **npm** or **yarn** package manager

### Step 1: Clone the Repository

```bash
git clone https://github.com/Petar164/fashionvoid_webshop_2.git
cd fashionvoid_webshop
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/fashionvoid_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Important:**
- Replace `username`, `password`, and `fashionvoid_db` with your MySQL credentials
- Generate a secure `NEXTAUTH_SECRET` by running: `openssl rand -base64 32`
- Get Cloudinary credentials from [cloudinary.com](https://cloudinary.com) (see `CLOUDINARY_SETUP.md`)

### Step 4: Set Up Database

1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE fashionvoid_db;
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

3. **Run Database Migrations:**
   ```bash
   npm run db:migrate
   ```
   When prompted, name it: `initial_setup`

4. **Seed the Database:**
   ```bash
   npm run db:seed
   ```
   This creates the default admin user:
   - **Email**: `admin@fashionvoid.net`
   - **Password**: `admin123`
   
   ⚠️ **Change this password immediately after first login!**

5. **Seed Sample Products (Optional):**
   ```bash
   npm run db:seed-products
   ```

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
fashionvoid_webshop/
├── app/
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── products/      # Product CRUD
│   │   ├── orders/        # Order management
│   │   ├── wishlist/      # Wishlist endpoints
│   │   └── upload/        # Cloudinary image upload
│   ├── checkout/          # Checkout page
│   ├── coming-soon/       # Payment coming soon page
│   ├── login/            # Login page
│   ├── register/          # Registration page
│   ├── product/[id]/      # Product detail pages
│   ├── purchases/        # User order history
│   ├── wishlist/         # User wishlist
│   └── page.tsx          # Home/shop page
├── components/
│   ├── AdminDashboard.tsx    # Admin product management
│   ├── Cart.tsx              # Shopping cart
│   ├── GalaxyStartScreen.tsx # Welcome screen
│   ├── Navbar.tsx            # Navigation with profile
│   └── ProductCard.tsx       # Product card component
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── auth-helpers.ts   # Auth utility functions
│   └── prisma.ts         # Prisma client instance
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
└── scripts/
    ├── seed-products.ts  # Product seeding script
    └── check-products.ts # Check products script
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with admin user
- `npm run db:seed-products` - Seed database with sample products
- `npm run db:check-products` - Check which products exist
- `npm run db:generate` - Generate Prisma Client
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Default Credentials

**Admin Account:**
- Email: `admin@fashionvoid.net`
- Password: `admin123`

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

## Adding Products

1. Log in as admin at `/login`
2. Navigate to `/admin` dashboard
3. Click "Add Product"
4. Fill in product details:
   - Name, description, price
   - Category (tops, bottoms, footwear, accessories)
   - Upload images via Cloudinary (drag & drop)
   - Add sizes and colors
   - Set quantity and stock status
   - Toggle featured (max 3 featured products)
5. Click "Save Product"

## Cloudinary Setup

For image uploads, you need a Cloudinary account:

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier available)
2. Get your credentials from the dashboard
3. Add them to your `.env` file
4. See `CLOUDINARY_SETUP.md` for detailed instructions

## 🛠️ Technical Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Zustand** - Lightweight state management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe ORM for MySQL
- **NextAuth.js** - Authentication & session management
- **bcryptjs** - Password hashing

### Services & Integrations
- **Cloudinary** - Image hosting and optimization
- **Stripe** - Payment processing
- **PayPal** - Payment processing
- **MySQL** - Relational database

### UI/UX
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library
- **Responsive Design** - Mobile-first approach

## 🎯 Project Highlights

- Built a complete full-stack e-commerce platform from scratch
- Implemented secure authentication and authorization with role-based access
- Integrated multiple payment gateways (Stripe & PayPal)
- Created an intuitive admin dashboard with comprehensive product management
- Optimized for performance with server-side rendering
- Implemented real-time inventory management
- Designed responsive UI with smooth animations
- Deployed to production (Railway)

## Database Schema

- **Users** - Admin and customer accounts
- **Products** - Product listings with variants
- **ProductVariants** - Size/color combinations with inventory
- **Orders** - Customer orders
- **OrderItems** - Items in each order
- **Addresses** - Shipping addresses
- **Wishlist** - User wishlist items

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Set up MySQL database (use Vercel Postgres or external MySQL)
5. Run migrations: `npm run db:migrate`
6. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Your own server with Node.js

**Note:** Make sure to set all environment variables in your hosting platform.

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists: `SHOW DATABASES;`
- Check MySQL user permissions

### Image Upload Issues
- Verify Cloudinary credentials in `.env`
- Check Cloudinary dashboard for upload limits
- Ensure `next.config.js` has Cloudinary in `remotePatterns`

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### Hydration Errors
- These usually resolve after restarting the dev server
- Ensure all client-side state is properly handled with `mounted` checks

## Support

For issues or questions:
- Check the documentation files in the root directory
- Review `TODO_COMPREHENSIVE.md` for planned features
- Check GitHub issues

## 📸 Screenshots

*Add screenshots of your application here*

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack development with Next.js
- Database design and management
- API design and security best practices
- Payment gateway integration
- Image handling and optimization
- State management patterns
- Responsive design principles
- Production deployment

## 📝 License

Copyright (c) 2025 Petar Vukovic. All Rights Reserved.

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 👤 Author

**Petar Vukovic**
- GitHub: [@PetarVdkc](https://github.com/PetarVdkc)
- Portfolio: *Add your portfolio link*

---

Built with ❤️ for FashionVoid
