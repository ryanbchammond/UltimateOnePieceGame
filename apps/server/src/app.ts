import cors from 'cors';
import express from 'express';

export const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});
