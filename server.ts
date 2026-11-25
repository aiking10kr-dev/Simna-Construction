import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  db,
  getPublicPositionStats,
  initDatabase,
  mapApplicationRow,
  mapCompanyRow,
  mapJobRow,
  mapTeamRow,
} from './src/db/database.ts';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

app.use(express.json({ limit: '256kb' }));

function hashWithSalt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, saltHex, 64).toString('hex');
}

function safeCompareStrings(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function createAdminToken(): string {
  const payload = {
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 12 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return false;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  if (!safeCompareStrings(sig, expectedSig)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    if (parsed.role !== 'admin') return false;
    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }
  next();
}

function normalizeMobile(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

function generateUniqueApplicationId(): string {
  const yearSuffix = String(new Date().getFullYear()).slice(-2);
  for (let attempt = 0; attempt < 15; attempt++) {
    const num = crypto.randomInt(100000, 999999);
    const candidate = `SIMNA-${yearSuffix}-${num}`;
    const existing = db.prepare('SELECT 1 FROM applications WHERE application_id = ?').get(candidate);
    if (!existing) {
      return candidate;
    }
  }
  return `SIMNA-${yearSuffix}-${Date.now().toString().slice(-6)}`;
}

// ---------- PUBLIC API ROUTES ----------

app.get('/api/public/bootstrap', (_req: Request, res: Response) => {
  const companyRow = db.prepare('SELECT * FROM company_info WHERE id = 1').get() as Record<string, unknown>;
  const jobRows = db.prepare('SELECT * FROM jobs WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all() as Array<Record<string, unknown>>;
  const teamRows = db.prepare('SELECT * FROM team_members ORDER BY sort_order ASC, id ASC').all() as Array<Record<string, unknown>>;

  res.json({
    company: mapCompanyRow(companyRow),
    jobs: jobRows.map(mapJobRow),
    team: teamRows.map(mapTeamRow),
    stats: getPublicPositionStats(),
  });
});

app.post('/api/applications', (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;

  if ('aadhaar' in body || 'aadhaarNumber' in body || 'bankAccount' in body || 'accountNumber' in body) {
    res.status(400).json({ error: 'Aadhaar and bank account details are not collected in the initial application.' });
    return;
  }

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const mobile = normalizeMobile(body.mobile);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const education = typeof body.education === 'string' ? body.education.trim() : '';
  const gender = typeof body.gender === 'string' ? body.gender.trim() : '';
  const pinCode = typeof body.pinCode === 'string' ? body.pinCode.trim() : '';
  const state = typeof body.state === 'string' ? body.state.trim() : '';
  const applyingFor = typeof body.applyingFor === 'string' ? body.applyingFor.trim() : '';

  if (fullName.length < 2 || fullName.length > 100) {
    res.status(400).json({ error: 'कृपया सही पूरा नाम दर्ज करें / Please enter a valid full name (2–100 chars).' });
    return;
  }
  if (address.length < 5 || address.length > 300) {
    res.status(400).json({ error: 'कृपया पूरा पता दर्ज करें / Please enter your complete address (min 5 chars).' });
    return;
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    res.status(400).json({ error: 'कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें / Please enter a valid 10-digit Indian mobile number.' });
    return;
  }
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'कृपया सही ईमेल पता दर्ज करें / Please enter a valid email address.' });
    return;
  }
  if (education.length < 2 || education.length > 100) {
    res.status(400).json({ error: 'कृपया शैक्षणिक योग्यता चुनें / Please select your education qualification.' });
    return;
  }
  if (!['Male', 'Female', 'Other'].includes(gender)) {
    res.status(400).json({ error: 'कृपया लिंग चुनें / Please select a valid gender.' });
    return;
  }
  if (!/^\d{6}$/.test(pinCode)) {
    res.status(400).json({ error: 'कृपया 6 अंकों का पिन कोड दर्ज करें / Please enter a valid 6-digit PIN code.' });
    return;
  }
  if (state.length < 2 || state.length > 80) {
    res.status(400).json({ error: 'कृपया राज्य चुनें / Please select your state.' });
    return;
  }

  const validJob = db
    .prepare('SELECT title FROM jobs WHERE LOWER(title) = LOWER(?) AND is_active = 1')
    .get(applyingFor) as { title: string } | undefined;
  if (!validJob) {
    res.status(400).json({ error: 'कृपया उपलब्ध पद चुनें / Please select a valid active job position.' });
    return;
  }

  const duplicate = db
    .prepare('SELECT application_id, status FROM applications WHERE mobile = ? AND applying_for = ?')
    .get(mobile, validJob.title) as { application_id: string; status: string } | undefined;

  if (duplicate) {
    res.status(409).json({
      error: `इस मोबाइल नंबर से ${validJob.title} पद के लिए आवेदन पहले ही हो चुका है (ID: ${duplicate.application_id})। / Duplicate application: This mobile number has already applied for ${validJob.title} (ID: ${duplicate.application_id}).`,
      existingApplicationId: duplicate.application_id,
    });
    return;
  }

  const applicationId = generateUniqueApplicationId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO applications (
      application_id, full_name, address, mobile, email, education, gender, pin_code, state, applying_for, status, admin_note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?, ?)
  `).run(
    applicationId,
    fullName,
    address,
    mobile,
    email,
    education,
    gender,
    pinCode,
    state,
    validJob.title,
    now,
    now
  );

  res.status(201).json({
    applicationId,
    fullName,
    applyingFor: validJob.title,
    status: 'Pending',
    createdAt: now,
  });
});

app.get('/api/applications/status', (req: Request, res: Response) => {
  const applicationId = typeof req.query.applicationId === 'string' ? req.query.applicationId.trim().toUpperCase() : '';
  const mobile = normalizeMobile(req.query.mobile);

  if (!applicationId || !/^[A-Z0-9\-]{6,32}$/.test(applicationId)) {
    res.status(400).json({ error: 'कृपया सही Application ID दर्ज करें / Please enter a valid Application ID.' });
    return;
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    res.status(400).json({ error: 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें / Please enter the 10-digit mobile number used during application.' });
    return;
  }

  const row = db
    .prepare(
      'SELECT application_id, full_name, applying_for, status, admin_note, created_at, updated_at FROM applications WHERE UPPER(application_id) = ? AND mobile = ?'
    )
    .get(applicationId, mobile) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({
      error: 'इस Application ID और मोबाइल नंबर से कोई आवेदन नहीं मिला। / No application found matching this Application ID and mobile number.',
    });
    return;
  }

  res.json({
    applicationId: String(row.application_id),
    fullName: String(row.full_name),
    applyingFor: String(row.applying_for),
    status: String(row.status),
    adminNote: String(row.admin_note ?? ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  });
});

// ---------- ADMIN AUTH ROUTES ----------

app.get('/api/admin/auth-status', (_req: Request, res: Response) => {
  const envPass = process.env.ADMIN_PASSCODE?.trim();
  const stored = db.prepare('SELECT 1 FROM admin_config WHERE id = 1').get();
  res.json({
    envConfigured: Boolean(envPass && envPass.length > 0),
    claimed: Boolean(stored),
  });
});

app.post('/api/admin/setup', (req: Request, res: Response) => {
  const envPass = process.env.ADMIN_PASSCODE?.trim();
  if (envPass && envPass.length > 0) {
    res.status(409).json({ error: 'Admin passcode is managed via server environment configuration.' });
    return;
  }

  const password = typeof (req.body as { password?: unknown }).password === 'string'
    ? (req.body as { password: string }).password
    : '';
  if (password.length < 6 || password.length > 100) {
    res.status(400).json({ error: 'Admin password must be between 6 and 100 characters.' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashWithSalt(password, salt);
  const storedValue = `${salt}:${hash}`;
  const result = db
    .prepare("INSERT OR IGNORE INTO admin_config (id, password_hash, updated_at) VALUES (1, ?, datetime('now'))")
    .run(storedValue);

  if (result.changes === 0) {
    res.status(409).json({ error: 'Admin password has already been claimed. Please log in.' });
    return;
  }

  const token = createAdminToken();
  res.status(201).json({ token });
});

app.post('/api/admin/login', (req: Request, res: Response) => {
  const password = typeof (req.body as { password?: unknown }).password === 'string'
    ? (req.body as { password: string }).password
    : '';
  if (!password) {
    res.status(400).json({ error: 'Password is required.' });
    return;
  }

  const envPass = process.env.ADMIN_PASSCODE?.trim();
  if (envPass && envPass.length > 0) {
    if (!safeCompareStrings(password, envPass)) {
      res.status(401).json({ error: 'गलत पासवर्ड / Invalid admin password.' });
      return;
    }
    res.json({ token: createAdminToken() });
    return;
  }

  const row = db.prepare('SELECT password_hash FROM admin_config WHERE id = 1').get() as { password_hash: string } | undefined;
  if (!row) {
    res.status(400).json({ error: 'Admin password has not been set up yet.' });
    return;
  }

  const [salt, storedHash] = row.password_hash.split(':');
  if (!salt || !storedHash) {
    res.status(500).json({ error: 'Admin credential store is invalid.' });
    return;
  }

  const candidateHash = hashWithSalt(password, salt);
  if (!safeCompareStrings(candidateHash, storedHash)) {
    res.status(401).json({ error: 'गलत पासवर्ड / Invalid admin password.' });
    return;
  }

  res.json({ token: createAdminToken() });
});

// ---------- PROTECTED ADMIN ROUTES ----------

app.get('/api/admin/applications', requireAdmin, (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const position = typeof req.query.position === 'string' ? req.query.position.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    conditions.push(
      '(LOWER(full_name) LIKE ? OR LOWER(application_id) LIKE ? OR mobile LIKE ? OR LOWER(email) LIKE ? OR LOWER(state) LIKE ?)'
    );
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }
  if (position && position !== 'All') {
    conditions.push('applying_for = ?');
    params.push(position);
  }
  if (status && status !== 'All') {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM applications ${whereClause} ORDER BY id DESC LIMIT 500`)
    .all(...params) as Array<Record<string, unknown>>;

  res.json({ applications: rows.map(mapApplicationRow) });
});

app.patch('/api/admin/applications/:applicationId/status', requireAdmin, (req: Request, res: Response) => {
  const { applicationId } = req.params;
  const body = req.body as { status?: unknown; adminNote?: unknown };
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim().slice(0, 300) : '';

  if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
    res.status(400).json({ error: 'Status must be Pending, Accepted, or Rejected.' });
    return;
  }

  const now = new Date().toISOString();
  const result = db
    .prepare('UPDATE applications SET status = ?, admin_note = ?, updated_at = ? WHERE application_id = ?')
    .run(status, adminNote, now, applicationId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }

  const updated = db.prepare('SELECT * FROM applications WHERE application_id = ?').get(applicationId) as Record<string, unknown>;
  res.json({ application: mapApplicationRow(updated) });
});

app.delete('/api/admin/applications/:applicationId', requireAdmin, (req: Request, res: Response) => {
  const { applicationId } = req.params;
  const result = db.prepare('DELETE FROM applications WHERE application_id = ?').run(applicationId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }
  res.json({ deleted: true });
});

app.get('/api/admin/jobs', requireAdmin, (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM jobs ORDER BY sort_order ASC, id ASC').all() as Array<Record<string, unknown>>;
  res.json({ jobs: rows.map(mapJobRow) });
});

app.put('/api/admin/jobs/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid job ID.' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const titleHi = typeof body.titleHi === 'string' ? body.titleHi.trim() : '';
  const salaryAmount = Number(body.salaryAmount);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const descriptionHi = typeof body.descriptionHi === 'string' ? body.descriptionHi.trim() : '';
  const openingsCount = Number(body.openingsCount);
  const isActive = body.isActive === false ? 0 : 1;

  if (title.length < 2 || title.length > 60) {
    res.status(400).json({ error: 'Job title must be 2–60 characters.' });
    return;
  }
  if (!Number.isFinite(salaryAmount) || salaryAmount < 1000 || salaryAmount > 500000) {
    res.status(400).json({ error: 'Salary must be between ₹1,000 and ₹5,00,000.' });
    return;
  }
  if (!Number.isInteger(openingsCount) || openingsCount < 0 || openingsCount > 1000) {
    res.status(400).json({ error: 'Openings count must be between 0 and 1000.' });
    return;
  }
  if (description.length < 5 || description.length > 500) {
    res.status(400).json({ error: 'Job description must be 5–500 characters.' });
    return;
  }

  const result = db
    .prepare(`
      UPDATE jobs
      SET title = ?, title_hi = ?, salary_amount = ?, description = ?, description_hi = ?, openings_count = ?, is_active = ?
      WHERE id = ?
    `)
    .run(title, titleHi || title, Math.round(salaryAmount), description, descriptionHi || description, openingsCount, isActive, id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Job vacancy not found.' });
    return;
  }

  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Record<string, unknown>;
  res.json({ job: mapJobRow(updated) });
});

app.post('/api/admin/team', requireAdmin, (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const roleHi = typeof body.roleHi === 'string' ? body.roleHi.trim() : '';
  const department = typeof body.department === 'string' ? body.department.trim() : '';
  const experience = typeof body.experience === 'string' ? body.experience.trim() : '';

  if (name.length < 2 || name.length > 80 || role.length < 2 || role.length > 80) {
    res.status(400).json({ error: 'Name and role are required (2–80 chars).' });
    return;
  }

  const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM team_members').get() as { max_sort: number };
  const result = db
    .prepare('INSERT INTO team_members (name, role, role_hi, department, experience, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, role, roleHi || role, department || 'Operations', experience || '3+ Years', maxSort.max_sort + 1);

  const created = db.prepare('SELECT * FROM team_members WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({ member: mapTeamRow(created) });
});

app.put('/api/admin/team/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid member ID.' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const roleHi = typeof body.roleHi === 'string' ? body.roleHi.trim() : '';
  const department = typeof body.department === 'string' ? body.department.trim() : '';
  const experience = typeof body.experience === 'string' ? body.experience.trim() : '';

  if (name.length < 2 || name.length > 80 || role.length < 2 || role.length > 80) {
    res.status(400).json({ error: 'Name and role are required (2–80 chars).' });
    return;
  }

  const result = db
    .prepare('UPDATE team_members SET name = ?, role = ?, role_hi = ?, department = ?, experience = ? WHERE id = ?')
    .run(name, role, roleHi || role, department || 'Operations', experience || '3+ Years', id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Team member not found.' });
    return;
  }

  const updated = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) as Record<string, unknown>;
  res.json({ member: mapTeamRow(updated) });
});

app.delete('/api/admin/team/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid member ID.' });
    return;
  }
  const result = db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Team member not found.' });
    return;
  }
  res.json({ deleted: true });
});

app.put('/api/admin/company', requireAdmin, (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
  const tagline = typeof body.tagline === 'string' ? body.tagline.trim() : '';
  const aboutEn = typeof body.aboutEn === 'string' ? body.aboutEn.trim() : '';
  const aboutHi = typeof body.aboutHi === 'string' ? body.aboutHi.trim() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const officeAddress = typeof body.officeAddress === 'string' ? body.officeAddress.trim() : '';

  if (companyName.length < 2 || companyName.length > 100) {
    res.status(400).json({ error: 'Company name must be 2–100 characters.' });
    return;
  }
  if (mobile.length < 8 || mobile.length > 25) {
    res.status(400).json({ error: 'Please provide a valid contact phone number.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please provide a valid company email address.' });
    return;
  }
  if (officeAddress.length < 5 || officeAddress.length > 300) {
    res.status(400).json({ error: 'Office address must be 5–300 characters.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE company_info
    SET company_name = ?, tagline = ?, about_en = ?, about_hi = ?, mobile = ?, whatsapp = ?, email = ?, office_address = ?, updated_at = ?
    WHERE id = 1
  `).run(
    companyName,
    tagline || 'Piping • Structure • All Work',
    aboutEn,
    aboutHi,
    mobile,
    whatsapp || mobile,
    email,
    officeAddress,
    now
  );

  const updated = db.prepare('SELECT * FROM company_info WHERE id = 1').get() as Record<string, unknown>;
  res.json({ company: mapCompanyRow(updated) });
});

// ---------- STATIC / VITE MIDDLEWARE ----------

async function startServer(): Promise<void> {
  const distPath = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Simna Construction server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
