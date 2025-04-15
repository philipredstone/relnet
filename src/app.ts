import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import networkRoutes from './routes/network.routes';
import peopleRoutes from './routes/people.routes';
import relationshipRoutes from './routes/relationship.routes';
import path from 'node:path';

dotenv.config();

const app: Application = express();

// Middleware
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

// Base route
/*app.get('/', (req, res) => {
    res.send('Friendship Network API is running');
});*/

app.use(express.static(path.join(__dirname, '../frontend/dist/')));

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'frontend/dist/index.html'));
});

export default app;
