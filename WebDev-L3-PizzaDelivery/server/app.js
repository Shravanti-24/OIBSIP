import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env, isProduction } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import healthRoutes from './routes/health.routes.js';
import pizzaRoutes from './routes/pizza.routes.js';
import ingredientRoutes from './routes/ingredient.routes.js';
import builderRoutes from './routes/builder.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

if (!isProduction) {
  app.use(morgan('dev'));
}

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pizzas', pizzaRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/builder', builderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/inventory', inventoryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
