const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection with better error handling
// Support multiple environment variable names for different platforms
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

let pool;
try {
  // Determine if we should use SSL
  // Use SSL for all databases EXCEPT localhost
  const isLocalDatabase = dbUrl?.includes('localhost') || dbUrl?.includes('127.0.0.1');
  const useSSL = !isLocalDatabase && !!dbUrl;
  
  console.log('Database connection:', {
    urlSet: !!dbUrl,
    urlPreview: dbUrl ? dbUrl.substring(0, 30) + '...' : 'none',
    sslEnabled: useSSL,
    isLocalDatabase: isLocalDatabase
  });
  
  // Create pool configuration
  const poolConfig = {
    connectionString: dbUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increase timeout for cloud connections
  };
  
  // Add SSL config for all non-localhost databases
  if (useSSL) {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }
  
  console.log('Pool config:', {
    hasSSL: !!poolConfig.ssl,
    maxConnections: poolConfig.max
  });
  
  pool = new Pool(poolConfig);
  
  // Test database connection
  pool.on('connect', () => {
    console.log('Database connected successfully');
  });
  
  pool.on('error', (err) => {
    console.error('Database connection error:', err);
  });
} catch (error) {
  console.error('Failed to create database pool:', error);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database tables with retry logic
const initializeDatabase = async (retries = 3) => {
  if (!pool) {
    console.error('Database pool not available');
    return;
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Initializing database... (attempt ${attempt}/${retries})`);
      
      // Create table with timeout
      await Promise.race([
        pool.query(`
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
        `),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 15000))
      ]);

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
      console.log('Database initialization completed');
      return; // Success - exit retry loop
    } catch (error) {
      console.error(`Error initializing database (attempt ${attempt}/${retries}):`, error.message);
      
      if (attempt < retries) {
        console.log(`Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn('Database initialization failed after all retries');
        // Don't throw - let the app run in fallback mode
        return;
      }
    }
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback route for when database is not available
app.get('/api/fallback', (req, res) => {
  res.json({
    message: 'Application is running but database is not available',
    status: 'partial',
    timestamp: new Date().toISOString(),
    platform: process.env.PLATFORM || 'unknown'
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
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
  if (!pool) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
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
  if (!pool) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
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
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    platform: process.env.PLATFORM || 'unknown',
    database: pool ? 'connected' : 'disconnected',
    port: port,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json(healthStatus);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with better error handling
const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Port:', port);
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Try to initialize database, but don't fail if it doesn't work
    try {
      await initializeDatabase();
      console.log('Database initialized successfully');
    } catch (dbError) {
      console.warn('Database initialization failed, continuing without database:', dbError.message);
      console.log('Application will run in fallback mode');
    }
    
    // Start the server
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check available at http://localhost:${port}/api/health`);
      console.log(`Fallback endpoint available at http://localhost:${port}/api/fallback`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
