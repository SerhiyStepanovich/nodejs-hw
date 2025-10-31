import express from 'express';
import cors from 'cors';
import pino from 'pino-http';
import helmet from 'helmet';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(pino());

app.get('/notes', (req, res) => {
  res.status(200).json({ message: 'Retrieved all notes' });
});
app.get('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  res.status(200).json({
    message: `Retrieved note with ID: ${noteId}`,
  });
});
app.get('/test-error', (req, res, next) => {
  throw new Error('Simulated server error');
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  req.log.error(err);
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ message: message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`To stop the server, press Ctrl + C`);
});
