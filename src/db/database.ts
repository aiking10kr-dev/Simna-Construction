import Database from 'better-sqlite3';
import path from 'node:path';
import type {
  CompanyInfo,
  JobApplication,
  JobVacancy,
  PublicPositionStat,
  TeamMember,
} from '../types.ts';

const DB_PATH = path.resolve(process.cwd(), 'simna.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      about_en TEXT NOT NULL,
      about_hi TEXT NOT NULL,
      mobile TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      office_address TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      salary_amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      description_hi TEXT NOT NULL,
      openings_count INTEGER NOT NULL DEFAULT 10,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      role_hi TEXT NOT NULL,
      department TEXT NOT NULL,
      experience TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      address TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      education TEXT NOT NULL,
      gender TEXT NOT NULL,
      pin_code TEXT NOT NULL,
      state TEXT NOT NULL,
      applying_for TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      admin_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_mobile_position
      ON applications (mobile, applying_for);
  `);

  seedInitialData();
}

function seedInitialData(): void {
  const companyCount = db.prepare('SELECT COUNT(*) as cnt FROM company_info').get() as { cnt: number };
  if (companyCount.cnt === 0) {
    db.prepare(`
      INSERT INTO company_info (
        id, company_name, tagline, about_en, about_hi, mobile, whatsapp, email, office_address
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      'Simna Construction',
      'Piping • Structure • All Work',
      'Simna Construction is a dedicated industrial contracting company specializing in heavy Piping, Structural Steel Erection, Welding, and All Civil & Mechanical Construction Works across India. We prioritize worker safety, timely salary, and transparent hiring.',
      'सिमना कंस्ट्रक्शन (Simna Construction) भारत की एक भरोसेमंद औद्योगिक निर्माण कंपनी है, जो पाइपिंग वर्क, स्ट्रक्चर वर्क, वेल्डिंग और सभी प्रकार के कंस्ट्रक्शन कार्यों में विशेषज्ञता रखती है। हम श्रमिकों की सुरक्षा, समय पर वेतन और पारदर्शी भर्ती को सर्वोच्च प्राथमिकता देते हैं।',
      '+91 98765 43210',
      '+91 98765 43210',
      'hr@simnaconstruction.in',
      'Plot 14, Industrial Area Phase II, Adityapur, Jamshedpur, Jharkhand - 831013'
    );
  }

  const jobsCount = db.prepare('SELECT COUNT(*) as cnt FROM jobs').get() as { cnt: number };
  if (jobsCount.cnt === 0) {
    const insertJob = db.prepare(`
      INSERT INTO jobs (slug, title, title_hi, salary_amount, description, description_hi, openings_count, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    insertJob.run(
      'labour',
      'Labour',
      'लेबर (सहायक कर्मकार)',
      15000,
      'Site material handling, loading/unloading, scaffolding assistance, site housekeeping, and general civil/piping support work.',
      'निर्माण स्थल पर सामग्री उठाना-रखना, लोडिंग/अनलोडिंग, मचान सहायता और सामान्य पाइपिंग व सिविल कार्य में सहयोग।',
      25,
      1
    );
    insertJob.run(
      'fitter',
      'Fitter',
      'फिटर (पाइप और स्ट्रक्चर)',
      30000,
      'Industrial piping alignment, flange assembly, structural steel fit-up, isometric drawing reading, and precision measurement.',
      'औद्योगिक पाइपिंग एलाइनमेंट, फ्लैंज फिटिंग, स्ट्रक्चरल स्टील असेंबली और ड्राइंग देखकर सटीक फिट-अप कार्य।',
      15,
      2
    );
    insertJob.run(
      'supervisor',
      'Supervisor',
      'सुपरवाइजर (साइट प्रभारी)',
      35000,
      'Supervising daily site workforce, enforcing PPE & safety rules, quality inspection, attendance management, and daily work reporting.',
      'साइट पर कामगारों की निगरानी, सुरक्षा नियमों का पालन करवाना, कार्य की गुणवत्ता जांच और दैनिक रिपोर्टिंग।',
      8,
      3
    );
    insertJob.run(
      'welder',
      'Welder',
      'वेल्डर (आर्क / टिग / मिग)',
      28000,
      'High-strength Arc, TIG, and MIG welding for heavy structural steel beams, industrial pipelines, and fabrication joints.',
      'हैवी स्ट्रक्चरल स्टील बीम और इंडस्ट्रियल पाइपलाइन जॉइंट्स की मज़बूत आर्क, टिग (TIG) और मिग (MIG) वेल्डिंग।',
      18,
      4
    );
  }

  const teamCount = db.prepare('SELECT COUNT(*) as cnt FROM team_members').get() as { cnt: number };
  if (teamCount.cnt === 0) {
    const insertMember = db.prepare(`
      INSERT INTO team_members (name, role, role_hi, department, experience, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertMember.run('Tanvi Sinha', 'Project Coordinator', 'प्रोजेक्ट समन्वयक', 'Operations & Planning', '7+ Years', 1);
    insertMember.run('Sanjana Kumari', 'HR & Recruitment Lead', 'एचआर और भर्ती प्रमुख', 'Workforce & Onboarding', '6+ Years', 2);
    insertMember.run('Nasir', 'Piping & Site Director', 'पाइपिंग और साइट निदेशक', 'Piping & Heavy Execution', '11+ Years', 3);
    insertMember.run('Ayan Khan', 'Structure & Safety Head', 'स्ट्रक्चर और सुरक्षा प्रमुख', 'Structural Steel & HSE', '9+ Years', 4);
  }
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function mapJobRow(row: Record<string, unknown>): JobVacancy {
  const salaryAmount = Number(row.salary_amount);
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    titleHi: String(row.title_hi),
    salaryAmount,
    salaryDisplay: formatINR(salaryAmount),
    description: String(row.description),
    descriptionHi: String(row.description_hi),
    openingsCount: Number(row.openings_count),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order),
  };
}

export function mapTeamRow(row: Record<string, unknown>): TeamMember {
  return {
    id: Number(row.id),
    name: String(row.name),
    role: String(row.role),
    roleHi: String(row.role_hi),
    department: String(row.department),
    experience: String(row.experience),
    sortOrder: Number(row.sort_order),
  };
}

export function mapCompanyRow(row: Record<string, unknown>): CompanyInfo {
  return {
    companyName: String(row.company_name),
    tagline: String(row.tagline),
    aboutEn: String(row.about_en),
    aboutHi: String(row.about_hi),
    mobile: String(row.mobile),
    whatsapp: String(row.whatsapp),
    email: String(row.email),
    officeAddress: String(row.office_address),
    updatedAt: String(row.updated_at),
  };
}

export function mapApplicationRow(row: Record<string, unknown>): JobApplication {
  return {
    id: Number(row.id),
    applicationId: String(row.application_id),
    fullName: String(row.full_name),
    address: String(row.address),
    mobile: String(row.mobile),
    email: String(row.email),
    education: String(row.education),
    gender: String(row.gender) as JobApplication['gender'],
    pinCode: String(row.pin_code),
    state: String(row.state),
    applyingFor: String(row.applying_for),
    status: String(row.status) as JobApplication['status'],
    adminNote: String(row.admin_note ?? ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function getPublicPositionStats(): { totalApplications: number; byPosition: PublicPositionStat[] } {
  const totalRow = db.prepare('SELECT COUNT(*) as cnt FROM applications').get() as { cnt: number };
  const rows = db.prepare(`
    SELECT
      applying_for,
      COUNT(*) as total_count,
      SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted_count,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count
    FROM applications
    GROUP BY applying_for
  `).all() as Array<Record<string, unknown>>;

  return {
    totalApplications: Number(totalRow.cnt),
    byPosition: rows.map((r) => ({
      applyingFor: String(r.applying_for),
      totalCount: Number(r.total_count),
      acceptedCount: Number(r.accepted_count),
      pendingCount: Number(r.pending_count),
    })),
  };
}
