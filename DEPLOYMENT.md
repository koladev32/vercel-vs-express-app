# Deployment Guide: Vercel vs Railway

This guide walks you through deploying the demo ecommerce application to both Vercel and Railway platforms.

## Prerequisites

- GitHub account
- Node.js installed locally (for testing)
- PostgreSQL database (for local testing)

## Local Testing

Before deploying, test the application locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your local database URL
   ```

3. **Build Tailwind CSS:**
   ```bash
   npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Visit http://localhost:3000** to test the application

## Deploying to Railway

Railway provides the easiest deployment experience for full-stack applications.

### Step 1: Prepare Your Repository

1. Push your code to a GitHub repository
2. Ensure your `package.json` has the correct scripts:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "build": "npm install"
     }
   }
   ```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect your Node.js application

### Step 3: Add PostgreSQL Database

1. In your project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provision a PostgreSQL instance
4. The `DATABASE_URL` environment variable will be automatically set

### Step 4: Configure Environment Variables

Add these environment variables in your Railway project settings:
- `NODE_ENV=production`
- `PLATFORM=railway`

### Step 5: Deploy

Railway will automatically:
- Install dependencies
- Build your application
- Start your server
- Provide a public URL

Your application will be available at `https://your-app-name.railway.app`

## Deploying to Vercel

Vercel requires more configuration for full-stack applications but provides excellent frontend optimization.

### Step 1: Prepare Your Repository

1. Ensure you have a `vercel.json` configuration file (included in this project)
2. Push your code to a GitHub repository

### Step 2: Set Up External Database

Since Vercel doesn't provide database hosting, you'll need an external service:

**Option A: Use Railway for Database**
1. Create a Railway project with only PostgreSQL
2. Get the `DATABASE_URL` from Railway
3. Use this URL in your Vercel deployment

**Option B: Use Other Database Providers**
- Supabase (free tier available)
- PlanetScale (free tier available)
- Neon (free tier available)

### Step 3: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project" and import your repository
3. Vercel will detect your Node.js application

### Step 4: Configure Environment Variables

In Vercel's dashboard, add these environment variables:
- `DATABASE_URL` (from your external database provider)
- `NODE_ENV=production`
- `PLATFORM=vercel`

### Step 5: Deploy

Vercel will:
- Build your application using the `@vercel/node` runtime
- Deploy your Express server as serverless functions
- Serve static files from the `public` directory
- Provide a public URL with automatic HTTPS

Your application will be available at `https://your-app-name.vercel.app`

## Configuration Files Explained

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

This configuration tells Vercel to:
- Build `server.js` as a serverless function
- Route API requests to the serverless function
- Serve static files from the `public` directory

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css
EXPOSE 3000
CMD ["npm", "start"]
```

This Dockerfile is used by Railway to:
- Use Node.js 18 Alpine image
- Install production dependencies
- Build Tailwind CSS
- Start the application

## Troubleshooting

### Common Railway Issues

**Database Connection Errors:**
- Ensure `DATABASE_URL` is set correctly
- Check that PostgreSQL service is running
- Verify SSL configuration for production

**Build Failures:**
- Check that all dependencies are in `package.json`
- Ensure build scripts are correct
- Check Railway logs for specific error messages

### Common Vercel Issues

**Serverless Function Errors:**
- Check function execution time limits (max 800 seconds)
- Verify memory limits (max 4GB)
- Ensure database connection string is correct

**Static File Issues:**
- Verify `vercel.json` routes configuration
- Check that static files are in the `public` directory
- Ensure Tailwind CSS is built before deployment

**Database Connection Issues:**
- Verify external database is accessible
- Check environment variables are set correctly
- Ensure SSL configuration for production databases

## Performance Optimization

### Railway Optimizations

1. **Use production dependencies only:**
   ```json
   {
     "scripts": {
       "build": "npm ci --only=production"
     }
   }
   ```

2. **Optimize Docker image:**
   - Use Alpine Linux base image
   - Multi-stage builds for smaller images
   - Remove unnecessary files

3. **Database optimization:**
   - Use connection pooling
   - Optimize queries
   - Use indexes appropriately

### Vercel Optimizations

1. **Optimize serverless functions:**
   - Keep functions lightweight
   - Use edge functions when possible
   - Implement proper caching

2. **Static file optimization:**
   - Compress images
   - Use modern image formats
   - Implement proper caching headers

3. **Database optimization:**
   - Use connection pooling
   - Implement query optimization
   - Use read replicas when possible

## Monitoring and Analytics

### Railway Monitoring

Railway provides built-in monitoring:
- Real-time logs
- Resource usage metrics
- Performance insights
- Error tracking

### Vercel Analytics

Vercel offers comprehensive analytics:
- Performance metrics
- User analytics
- Function execution metrics
- Error tracking

## Cost Optimization Tips

### Railway Cost Optimization

1. **Right-size your resources:**
   - Use appropriate CPU and memory allocations
   - Monitor usage patterns
   - Scale down during low-traffic periods

2. **Optimize database usage:**
   - Use connection pooling
   - Implement query optimization
   - Use appropriate indexes

### Vercel Cost Optimization

1. **Optimize function usage:**
   - Keep functions lightweight
   - Implement proper caching
   - Use edge functions when possible

2. **Monitor bandwidth usage:**
   - Optimize images and assets
   - Use CDN effectively
   - Implement proper caching

## Conclusion

Both platforms offer excellent deployment experiences, but with different strengths:

- **Railway** excels at full-stack deployment with integrated services
- **Vercel** provides superior frontend optimization and serverless architecture

Choose the platform that best fits your application's architecture and requirements. Both will provide you with the tools needed to deploy and scale your application successfully.
