import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import menuRouter from './server/routes/menu.ts';
import tablesRouter from './server/routes/tables.ts';
import ordersRouter from './server/routes/orders.ts';
import paymentsRouter from './server/routes/payments.ts';
import adminAuthRouter from './server/routes/admin/auth.ts';
import adminDashboardRouter from './server/routes/admin/dashboard.ts';
import adminOrdersRouter from './server/routes/admin/orders.ts';
import adminProductsRouter from './server/routes/admin/products.ts';
import adminCategoriesRouter from './server/routes/admin/categories.ts';
import adminTablesRouter from './server/routes/admin/tables.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cafenard-api', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/menu', menuRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/categories', adminCategoriesRouter);
app.use('/api/admin/tables', adminTablesRouter);

// Frontend Vite integration
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`☕ Cafe Nard server running at http://0.0.0.0:${PORT}`);
});
