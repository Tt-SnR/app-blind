import { serve } from '@hono/node-server';
import { Hono } from 'hono';
const app = new Hono();
app.get('/', (c) => c.text('Hello Node.js!'));
serve({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 4000,
});
