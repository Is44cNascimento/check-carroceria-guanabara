import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import express, { Request, Response } from 'express';
import { join } from 'node:path';
import { Pool } from 'pg';
import rateLimit from 'express-rate-limit';
import 'zone.js/node';

const browserDistFolder = join(import.meta.dirname, '../browser');
const app = express();
const angularApp = new AngularNodeAppEngine();

const pool = new Pool({
  host: process.env['PGHOST'] ?? 'localhost',
  port: Number(process.env['PGPORT'] ?? 5432),
  user: process.env['PGUSER'] ?? 'postgres',
  password: process.env['PGPASSWORD'] ?? 'postgres',
  database: process.env['PGDATABASE'] ?? 'checklist'
});

let initDbPromise: Promise<void> | null = null;

type ChecklistValue = Record<string, boolean>;

type StartChecklistBody = {
  operatorName?: string;
  carPrefix?: string;
};

type SubmitChecklistBody = {
  sessionId?: number;
  operatorName?: string;
  carPrefix?: string;
  checklist?: ChecklistValue;
};


function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isChecklistValue(value: unknown): value is ChecklistValue {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return false;
  }

  return entries.every(([, answer]) => typeof answer === 'boolean');
}

async function ensureDatabase(): Promise<void> {
  if (!initDbPromise) {
    initDbPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS checklist_submissions (
        id BIGSERIAL PRIMARY KEY,
        operator_name TEXT NOT NULL,
        car_prefix TEXT NOT NULL,
        checklist JSONB,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `).then(() => undefined);
  }

  return initDbPromise;
}

const apiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas requisições. Tente novamente em instantes.' }
});

app.use(express.json());

app.post('/api/checklist/start', apiRateLimit, async (req: Request<{}, {}, StartChecklistBody>, res: Response) => {
  try {
    await ensureDatabase();

    const operatorName = normalizeText(req.body.operatorName);
    const carPrefix = normalizeText(req.body.carPrefix);

    if (!operatorName || !carPrefix) {
      res.status(400).json({ message: 'Nome do operador e prefixo do carro são obrigatórios.' });
      return;
    }

    const result = await pool.query<{ id: string }>(
      `
      INSERT INTO checklist_submissions (operator_name, car_prefix)
      VALUES ($1, $2)
      RETURNING id
      `,
      [operatorName, carPrefix]
    );

    res.status(201).json({ sessionId: Number(result.rows[0].id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao iniciar checklist no banco de dados.' });
  }
});

app.post('/api/checklist/submit', apiRateLimit, async (req: Request<{}, {}, SubmitChecklistBody>, res: Response) => {
  try {
    await ensureDatabase();

    const sessionId = Number(req.body.sessionId);
    const operatorName = normalizeText(req.body.operatorName);
    const carPrefix = normalizeText(req.body.carPrefix);
    const checklist = req.body.checklist;

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      res.status(400).json({ message: 'Sessão inválida.' });
      return;
    }

    if (!operatorName || !carPrefix) {
      res.status(400).json({ message: 'Nome do operador e prefixo do carro são obrigatórios.' });
      return;
    }

    if (!isChecklistValue(checklist)) {
      res.status(400).json({ message: 'Checklist inválido.' });
      return;
    }

    const result = await pool.query(
      `
      UPDATE checklist_submissions
      SET checklist = $1::jsonb,
          completed_at = NOW()
      WHERE id = $2
        AND operator_name = $3
        AND car_prefix = $4
      `,
      [JSON.stringify(checklist), sessionId, operatorName, carPrefix]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Sessão não encontrada para finalizar checklist.' });
      return;
    }

    res.status(200).json({ message: 'Checklist salvo com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao salvar checklist no banco de dados.' });
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false
  })
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
