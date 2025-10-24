const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        category VARCHAR(100),
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample products if table is empty
    const result = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(result.rows[0].count) === 0) {
      const sampleProducts = [
        {
          name: 'Wireless Bluetooth Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 199.99,
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
          category: 'Electronics',
          stock_quantity: 50
        },
        {
          name: 'Smart Fitness Watch',
          description: 'Track your fitness goals with this advanced smartwatch',
          price: 299.99,
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
          category: 'Electronics',
          stock_quantity: 30
        },
        {
          name: 'Organic Coffee Beans',
          description: 'Premium organic coffee beans from Colombia',
          price: 24.99,
          image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300',
          category: 'Food & Beverage',
          stock_quantity: 100
        },
        {
          name: 'Yoga Mat Premium',
          description: 'Non-slip yoga mat perfect for all types of yoga practice',
          price: 79.99,
          image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300',
          category: 'Sports',
          stock_quantity: 75
        },
        {
          name: 'Minimalist Backpack',
          description: 'Sleek and functional backpack for everyday use',
          price: 89.99,
          image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
          category: 'Accessories',
          stock_quantity: 40
        }
      ];

      for (const product of sampleProducts) {
        await pool.query(
          'INSERT INTO products (name, description, price, image_url, category, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6)',
          [product.name, product.description, product.price, product.image_url, product.category, product.stock_quantity]
        );
      }
      console.log('Sample products inserted successfully');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    res.json({
      products: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get product categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json(result.rows.map(row => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    platform: process.env.PLATFORM || 'unknown'
  });
});

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;
