import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import networkRoutes from './routes/network.routes';
import peopleRoutes from './routes/people.routes';
import relationshipRoutes from './routes/relationship.routes';
import path from 'node:path';
import helmet from 'helmet';
import connectDB from './config/db';

dotenv.config();

connectDB();

const app: Application = express();

// Middleware
// Apply Helmet to API routes only
app.use(
  '/api',
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://0.0.0.0:3000',
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/networks', networkRoutes);
app.use('/api/networks', peopleRoutes);
app.use('/api/networks', relationshipRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.send('OK');
});

// In development, Vite handles static files
// In production, we serve static files from the dist directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, '../dist')));

  // Always return the main index.html for any route that doesn't match an API endpoint
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/index.html'));
  });
} else {
  // This will be handled by the Vite dev server
}

// This setup allows the server to be used both standalone and with Vite
if (import.meta.env?.PROD) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
