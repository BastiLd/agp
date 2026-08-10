import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());

const csvPath = path.join(__dirname, 'data', 'waitlist.csv');

async function appendEmail(email) {
  const line = `${email},${new Date().toISOString()}\n`;
  await fs.mkdir(path.dirname(csvPath), { recursive: true });
  await fs.appendFile(csvPath, line, 'utf8');
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/waitlist', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !isEmailValid(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  try {
    await appendEmail(email.trim());
    return res.json({ ok: true });
  } catch (err) {
    console.error('appendEmail failed', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

if (import.meta.url === `file://${__filename}`) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API on :${port}`));
}

export default app;

