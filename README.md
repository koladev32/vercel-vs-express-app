# Vercel vs Railway Demo App

A simple ecommerce application built with Express.js, Tailwind CSS, and PostgreSQL for comparing deployment on Vercel and Railway platforms.

## Features

- Product listing with category filtering
- Product detail view
- Responsive design with Tailwind CSS
- PostgreSQL database integration
- RESTful API endpoints
- Health check endpoint

## Tech Stack

- **Backend**: Express.js
- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **Database**: PostgreSQL
- **Package Manager**: npm

## API Endpoints

- `GET /` - Main application page
- `GET /api/products` - List all products (supports category, limit, offset query params)
- `GET /api/products/:id` - Get single product by ID
- `GET /api/categories` - Get all product categories
- `GET /api/health` - Health check endpoint

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)
- `PLATFORM` - Deployment platform identifier

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

3. Build Tailwind CSS:
   ```bash
   npm run build:css
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This app is designed to be deployed on both Vercel and Railway platforms for comparison purposes.

### Railway Deployment

Railway supports full-stack applications with PostgreSQL databases. The app can be deployed directly with a Dockerfile or by connecting a GitHub repository.

### Vercel Deployment

Vercel is optimized for frontend applications. For this full-stack app, you'll need to:
1. Deploy the backend as serverless functions
2. Use an external PostgreSQL database (Railway can provide this)
3. Configure environment variables

## Database Schema

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Sample Data

The application automatically creates sample products on first run:
- Wireless Bluetooth Headphones
- Smart Fitness Watch
- Organic Coffee Beans
- Yoga Mat Premium
- Minimalist Backpack
