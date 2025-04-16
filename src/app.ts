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

dotenv.config();

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
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/networks', networkRoutes);
app.use('/api/networks', peopleRoutes);
app.use('/api/networks', relationshipRoutes);

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

app.use(express.static(path.join(__dirname, '../frontend/dist/')));

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'frontend/dist/index.html'));
});

export default app;
