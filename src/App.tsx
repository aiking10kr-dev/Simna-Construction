import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Flame,
  Footprints,
  HardHat,
  Home,
  Info,
  Layers,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ApplicationForm } from './components/ApplicationForm.tsx';
import { BannerSlider } from './components/BannerSlider.tsx';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallBanner.tsx';
import { SimnaLogo } from './components/SimnaLogo.tsx';
import type {
  AppView,
  ApplicationStatusLookup,
  PublicBootstrapData,
} from './types.ts';

interface MenuOption {
  num: string;
  view: AppView;
  titleHi: string;
  titleEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MAIN_MENU_ITEMS: MenuOption[] = [
  { num: '01', view: 'apply', titleHi: 'नौकरी के लिए आवेदन', titleEn: 'Apply for Job', icon: ClipboardList },
  { num: '02', view: 'vacancies', titleHi: 'खाली पद और वेतन', titleEn: 'Vacancies & Salary', icon: Briefcase },
  { num: '03', view: 'work', titleHi: 'हमारे काम', titleEn: 'Our Work', icon: Wrench },
  { num: '04', view: 'documents', titleHi: 'ज़रूरी दस्तावेज़', titleEn: 'Required Documents', icon: FileText },
  { num: '05', view: 'safety', titleHi: 'सुरक्षा नियम', titleEn: 'Safety Rules', icon: HardHat },
  { num: '06', view: 'team', titleHi: 'हमारी टीम', titleEn: 'Our Team', icon: Users },
  { num: '07', view: 'about', titleHi: 'कंपनी के बारे में', titleEn: 'About Company', icon: Info },
  { num: '08', view: 'contact', titleHi: 'संपर्क करें', titleEn: 'Contact Us', icon: Phone },
  { num: '09', view: 'applications', titleHi: 'आए आवेदन', titleEn: 'Applications & Status', icon: ShieldCheck },
];

const DEFAULT_BOOTSTRAP: PublicBootstrapData = {
  company: {
    companyName: 'Simna Construction',
    tagline: 'Piping • Structure • All Work',
    aboutEn:
      'Simna Construction is a dedicated industrial contracting company specializing in heavy Piping, Structural Steel Erection, Welding, and All Civil & Mechanical Construction Works across India.',
    aboutHi:
      'सिमना कंस्ट्रक्शन (Simna Construction) भारत की एक भरोसेमंद औद्योगिक निर्माण कंपनी है, जो पाइपिंग वर्क, स्ट्रक्चर वर्क, वेल्डिंग और सभी प्रकार के कंस्ट्रक्शन कार्यों में विशेषज्ञता रखती है।',
    mobile: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'hr@simnaconstruction.in',
    officeAddress: 'Plot 14, Industrial Area Phase II, Adityapur, Jamshedpur, Jharkhand - 831013',
    updatedAt: '',
  },
  jobs: [
    {
      id: 1,
      slug: 'labour',
      title: 'Labour',
      titleHi: 'लेबर (सहायक कर्मकार)',
      salaryAmount: 15000,
      salaryDisplay: '₹15,000',
      description: 'Site material handling, loading/unloading, scaffolding assistance, and general construction support.',
      descriptionHi: 'निर्माण स्थल पर सामग्री उठाना-रखना, लोडिंग/अनलोडिंग और सामान्य निर्माण कार्य में सहयोग।',
      openingsCount: 25,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 2,
      slug: 'fitter',
      title: 'Fitter',
      titleHi: 'फिटर (पाइप और स्ट्रक्चर)',
      salaryAmount: 30000,
      salaryDisplay: '₹30,000',
      description: 'Industrial piping alignment, flange assembly, structural steel fit-up, and isometric blueprint reading.',
      descriptionHi: 'औद्योगिक पाइपिंग एलाइनमेंट, फ्लैंज फिटिंग, स्ट्रक्चरल स्टील असेंबली और ड्राइंग के अनुसार फिट-अप कार्य।',
      openingsCount: 15,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 3,
      slug: 'supervisor',
      title: 'Supervisor',
      titleHi: 'सुपरवाइजर (साइट प्रभारी)',
      salaryAmount: 35000,
      salaryDisplay: '₹35,000',
      description: 'Supervising daily site workforce, enforcing PPE & safety rules, quality checks, and daily reporting.',
      descriptionHi: 'साइट पर कामगारों की निगरानी, सुरक्षा नियमों का पालन करवाना और दैनिक कार्य रिपोर्टिंग।',
      openingsCount: 8,
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 4,
      slug: 'welder',
      title: 'Welder',
      titleHi: 'वेल्डर (आर्क / टिग / मिग)',
      salaryAmount: 28000,
      salaryDisplay: '₹28,000',
      description: 'High-strength Arc, TIG, and MIG welding for heavy structural steel beams and industrial pipelines.',
      descriptionHi: 'हैवी स्ट्रक्चरल स्टील और इंडस्ट्रियल पाइपलाइन जॉइंट्स की मज़बूत आर्क, टिग और मिग वेल्डिंग।',
      openingsCount: 18,
      isActive: true,
      sortOrder: 4,
    },
  ],
  team: [
    { id: 1, name: 'Tanvi Sinha', role: 'Project Coordinator', roleHi: 'प्रोजेक्ट समन्वयक', department: 'Operations & Planning', experience: '7+ Years', sortOrder: 1 },
    { id: 2, name: 'Sanjana Kumari', role: 'HR & Recruitment Lead', roleHi: 'एचआर और भर्ती प्रमुख', department: 'Workforce & Onboarding', experience: '6+ Years', sortOrder: 2 },
    { id: 3, name: 'Nasir', role: 'Piping & Site Director', roleHi: 'पाइपिंग और साइट निदेशक', department: 'Piping & Heavy Execution', experience: '11+ Years', sortOrder: 3 },
    { id: 4, name: 'Ayan Khan', role: 'Structure & Safety Head', roleHi: 'स्ट्रक्चर और सुरक्षा प्रमुख', department: 'Structural Steel & HSE', experience: '9+ Years', sortOrder: 4 },
  ],
  stats: {
    totalApplications: 0,
    byPosition: [],
  },
};

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [preselectedJob, setPreselectedJob] = useState<string>('');
  const [data, setData] = useState<PublicBootstrapData>(DEFAULT_BOOTSTRAP);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Status tracker state
  const [lookupAppId, setLookupAppId] = useState('');
  const [lookupMobile, setLookupMobile] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState<ApplicationStatusLookup | null>(null);

  const fetchBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/public/bootstrap');
      if (res.ok) {
        const json = (await res.json()) as PublicBootstrapData;
        setData(json);
      }
    } catch {
      // keep initial/cached data on network blip
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBootstrap();
  }, [fetchBootstrap]);

  const navigateTo = (target: AppView, jobTitle?: string) => {
    if (jobTitle) {
      setPreselectedJob(jobTitle);
    }
    setView(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const runStatusLookup = async (appId: string, mobileNum: string) => {
    setLookupError('');
    setLookupResult(null);
    setLookupLoading(true);
    try {
      const params = new URLSearchParams({
        applicationId: appId.trim().toUpperCase(),
        mobile: mobileNum.trim(),
      });
      const res = await fetch(`/api/applications/status?${params.toString()}`);
      const json = (await res.json()) as ApplicationStatusLookup & { error?: string };
      if (!res.ok) {
        setLookupError(json.error || 'आवेदन नहीं मिला / Application not found.');
        return;
      }
      setLookupResult(json);
    } catch {
      setLookupError('नेटवर्क त्रुटि / Network error while checking status.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleTrackFromReceipt = (appId: string, mobileNum: string) => {
    setLookupAppId(appId);
    setLookupMobile(mobileNum);
    setView('applications');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void runStatusLookup(appId, mobileNum);
  };

  const cleanPhone = (val: string) => val.replace(/[^\d+]/g, '');
  const cleanWhatsApp = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const { company, jobs, team, stats } = data;

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-zinc-100 pb-24">
      {/* Compact Sticky Top Bar (52px, 3 zones) */}
      <header className="sticky top-0 z-40 h-14 border-b border-zinc-800/90 bg-[#0B0C0E]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark / Back Button */}
          <div className="flex items-center gap-2.5 min-w-0">
            {view !== 'home' ? (
              <button
                type="button"
                onClick={() => navigateTo('home')}
                aria-label="Back to Home"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-yellow-400/50 hover:text-yellow-400 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <SimnaLogo size="sm" />
            )}
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="font-display text-lg sm:text-xl font-bold tracking-wide text-white whitespace-nowrap shrink-0 hover:text-yellow-400 transition-colors"
            >
              {company.companyName}
            </button>
          </div>

          {/* Zone 2: Concise Desktop Nav Links */}
          <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`whitespace-nowrap shrink-0 hover:text-yellow-400 transition-colors ${view === 'home' ? 'text-yellow-400' : ''}`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigateTo('vacancies')}
              className={`whitespace-nowrap shrink-0 hover:text-yellow-400 transition-colors ${view === 'vacancies' ? 'text-yellow-400' : ''}`}
            >
              Vacancies
            </button>
            <button
              type="button"
              onClick={() => navigateTo('work')}
              className={`whitespace-nowrap shrink-0 hover:text-yellow-400 transition-colors ${view === 'work' ? 'text-yellow-400' : ''}`}
            >
              Our Work
            </button>
            <button
              type="button"
              onClick={() => navigateTo('safety')}
              className={`whitespace-nowrap shrink-0 hover:text-yellow-400 transition-colors ${view === 'safety' ? 'text-yellow-400' : ''}`}
            >
              Safety
            </button>
            <button
              type="button"
              onClick={() => navigateTo('contact')}
              className={`whitespace-nowrap shrink-0 hover:text-yellow-400 transition-colors ${view === 'contact' ? 'text-yellow-400' : ''}`}
            >
              Contact
            </button>
          </nav>

          {/* Zone 3: Primary Action + Install */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                view === 'admin'
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-yellow-400/60 hover:text-yellow-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 space-y-7">
        {/* ==================== HOME SCREEN ==================== */}
        {view === 'home' && (
          <>
            {/* Welcome & Brand Identity Hero */}
            <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-5 sm:p-7">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <SimnaLogo size="lg" />
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                      {company.companyName}
                    </h1>
                    <p className="text-sm sm:text-base font-semibold text-yellow-400 tracking-wide">
                      {company.tagline}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 lg:max-w-xl w-full">
                  <p className="text-base sm:text-lg font-bold text-white leading-snug">
                    नमस्ते 👋 काम करना है? यहाँ से शुरू करें।
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('apply')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[44px]"
                  >
                    <span>आवेदन करें</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Sliding Banners */}
            <BannerSlider onNavigate={(target) => navigateTo(target)} />

            {/* 9 Main Menu Options */}
            <section aria-labelledby="main-menu-heading" className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 id="main-menu-heading" className="text-2xl sm:text-3xl font-bold text-white">
                    मुख्य मेनू / Main Menu
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    सभी सेवाओं, पदों और जानकारी के लिए नीचे चुनें
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400 tabular-nums hidden sm:inline">
                  9 Sections · Direct Access
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                {MAIN_MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.view}
                      type="button"
                      onClick={() => navigateTo(item.view)}
                      className="group rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/90 hover:border-yellow-400/60 p-4 sm:p-5 text-left transition-all active:scale-[0.99] flex flex-col justify-between min-h-[124px]"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-11 h-11 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-zinc-950 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-xs text-zinc-500 group-hover:text-yellow-400 transition-colors tabular-nums">
                          {item.num}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-base sm:text-lg font-bold text-white group-hover:text-yellow-300 transition-colors leading-snug">
                          {item.titleHi}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">{item.titleEn}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Quick Job Vacancies & Salary Strip */}
            <section aria-labelledby="home-vacancies-heading" className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="home-vacancies-heading" className="text-2xl sm:text-3xl font-bold text-white">
                    खाली पद और मासिक वेतन / Open Vacancies
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    सीधी कंपनी भर्ती · कोई रजिस्ट्रेशन शुल्क नहीं
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('vacancies')}
                  className="text-xs sm:text-sm font-semibold text-yellow-400 hover:underline whitespace-nowrap shrink-0"
                >
                  सभी पद देखें →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                        <span>{job.openingsCount} पद खाली</span>
                        <span className="text-emerald-400 font-semibold">Open</span>
                      </div>
                      <h3 className="mt-1.5 text-xl font-bold text-white">{job.title}</h3>
                      <p className="text-xs text-zinc-400">{job.titleHi}</p>
                      <div className="mt-3 font-mono text-2xl font-bold text-yellow-400 tabular-nums">
                        {job.salaryDisplay}
                        <span className="text-xs font-sans font-normal text-zinc-400"> / माह</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo('apply', job.title)}
                      className="w-full rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors min-h-[44px]"
                    >
                      Apply Now / आवेदन करें
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ==================== 1. APPLY FORM ==================== */}
        {view === 'apply' && (
          <ApplicationForm
            jobs={jobs}
            preselectedJob={preselectedJob}
            onSuccessSubmit={() => void fetchBootstrap()}
            onTrackApplication={handleTrackFromReceipt}
            onNavigate={(v) => navigateTo(v)}
          />
        )}

        {/* ==================== 2. JOB VACANCIES & SALARY ==================== */}
        {view === 'vacancies' && (
          <section className="space-y-6">
            <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  खाली पद और वेतन / Job Vacancies & Salary
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Simna Construction में उपलब्ध वर्तमान नौकरियाँ और मासिक वेतन विवरण
                </p>
              </div>
              <div className="text-xs sm:text-sm text-zinc-400 font-mono tabular-nums">
                {jobs.length} Active Categories
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
                लोड हो रहा है... / Loading vacancies...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs text-zinc-400">
                            {job.openingsCount} Openings · Monthly Salary
                          </div>
                          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white">
                            {job.title}
                          </h2>
                          <p className="text-sm font-medium text-yellow-400">{job.titleHi}</p>
                        </div>
                        <div className="rounded-xl border border-yellow-400/30 bg-zinc-950 px-4 py-2.5 text-right shrink-0">
                          <div className="font-mono text-xl sm:text-2xl font-bold text-yellow-400 tabular-nums">
                            {job.salaryDisplay}
                          </div>
                          <div className="text-[11px] text-zinc-400">प्रति माह / Month</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                        <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                          {job.descriptionHi}
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                          {job.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateTo('apply', job.title)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3.5 text-sm sm:text-base font-bold text-zinc-950 hover:bg-yellow-300 active:scale-[0.99] transition-all min-h-[48px]"
                    >
                      <span>Apply Now / अभी आवेदन करें</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================== 3. COMPANY WORK DETAILS ==================== */}
        {view === 'work' && (
          <section className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                हमारे काम / Our Construction Work
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Piping Work · Structure Work · All Construction Work
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {[
                {
                  id: 'piping',
                  titleHi: 'पाइपिंग वर्क',
                  titleEn: 'Piping Work',
                  image: '/src/assets/images/banner_piping_work_1795626380510.jpg',
                  icon: Wrench,
                  descHi:
                    'इंडस्ट्रियल प्लांट्स, रिफाइनरी और फैक्ट्रियों के लिए हाई-प्रेशर स्टील पाइपलाइन फिटिंग, वेल्डिंग, फ्लैंज असेंबली और हाइड्रो-टेस्टिंग कार्य।',
                  descEn:
                    'High-pressure industrial pipeline fabrication, isometric spool erection, flange alignment, and precision fit-up for plants and refineries.',
                },
                {
                  id: 'structure',
                  titleHi: 'स्ट्रक्चर वर्क',
                  titleEn: 'Structure Work',
                  image: '/src/assets/images/banner_structure_work_1795626381533.jpg',
                  icon: Layers,
                  descHi:
                    'हैवी स्टील बीम, कॉलम, इंडस्ट्रियल शेड, पाइप रैक और बहुमंजिला स्टील फ्रेमवर्क का निर्माण, बोल्टिंग व सुरक्षित इरेक्शन।',
                  descEn:
                    'Heavy structural steel fabrication, industrial shed trusses, pipe racks, crane-assisted beam erection, and bolted/welded steel frameworks.',
                },
                {
                  id: 'all',
                  titleHi: 'सभी निर्माण कार्य',
                  titleEn: 'All Construction Work',
                  image: '/src/assets/images/banner_all_construction_1795626381580.jpg',
                  icon: Building2,
                  descHi:
                    'सिविल फाउंडेशन, आरसीसी निर्माण, साइट डेवलपमेंट, औद्योगिक रखरखाव और संपूर्ण मैकेनिकल-सिविल प्रोजेक्ट निष्पादन।',
                  descEn:
                    'Complete civil foundations, RCC works, factory infrastructure, plant shutdown maintenance, and turnkey construction execution.',
                },
              ].map((work) => {
                const Icon = work.icon;
                return (
                  <article
                    key={work.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-52 bg-zinc-950">
                        {!failedImages[work.id] ? (
                          <img
                            src={work.image}
                            alt={work.titleEn}
                            referrerPolicy="no-referrer"
                            onError={() => setFailedImages((p) => ({ ...p, [work.id]: true }))}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <Icon className="w-12 h-12 text-yellow-400/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                      </div>
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">{work.titleHi}</h2>
                            <p className="text-xs font-medium text-yellow-400">{work.titleEn}</p>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-200 leading-relaxed">{work.descHi}</p>
                        <p className="text-xs text-zinc-400 leading-relaxed">{work.descEn}</p>
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <button
                        type="button"
                        onClick={() => navigateTo('apply')}
                        className="w-full rounded-xl border border-yellow-400/40 bg-yellow-400/10 py-2.5 text-sm font-bold text-yellow-300 hover:bg-yellow-400 hover:text-zinc-950 transition-colors min-h-[44px]"
                      >
                        इस कार्य के लिए आवेदन करें / Apply Now
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== 4. REQUIRED DOCUMENTS ==================== */}
        {view === 'documents' && (
          <section className="space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-zinc-800 pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                ज़रूरी दस्तावेज़ / Required Documents
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                जॉइनिंग और दस्तावेज़ सत्यापन के समय निम्नलिखित कागज़ात की आवश्यकता होगी
              </p>
            </div>

            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                ध्यान दें: ऑनलाइन आवेदन फ़ॉर्म भरते समय आधार नंबर या बैंक पासबुक की जानकारी नहीं माँगी जाती। नीचे दिए दस्तावेज़ केवल चयन के बाद ऑफिस में सत्यापन के लिए ज़रूरी हैं।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  titleHi: 'शैक्षणिक योग्यता प्रमाणपत्र',
                  titleEn: 'Educational Qualification Certificate',
                  descHi: '8वीं, 10वीं, 12वीं की मार्कशीट या ITI / डिप्लोमा प्रमाणपत्र (यदि लागू हो)।',
                  icon: Award,
                },
                {
                  titleHi: 'पहचान प्रमाणपत्र',
                  titleEn: 'Identity Proof',
                  descHi: 'सरकार द्वारा मान्य फोटो पहचान पत्र (जैसे वोटर आईडी, पैन कार्ड या ड्राइविंग लाइसेंस)।',
                  icon: BadgeCheck,
                },
                {
                  titleHi: 'पता प्रमाणपत्र',
                  titleEn: 'Address Proof',
                  descHi: 'निवास का प्रमाण पत्र, राशन कार्ड, बिजली बिल या सरकारी पते का दस्तावेज़।',
                  icon: MapPin,
                },
                {
                  titleHi: 'अनुभव प्रमाणपत्र (यदि उपलब्ध हो)',
                  titleEn: 'Experience Certificate (if available)',
                  descHi: 'पिछली कंपनी का कार्य अनुभव पत्र या वेल्डर/फिटर ट्रेड टेस्ट प्रमाणपत्र।',
                  icon: Briefcase,
                },
              ].map((doc) => {
                const Icon = doc.icon;
                return (
                  <div
                    key={doc.titleEn}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-yellow-400 text-zinc-950 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{doc.titleHi}</h2>
                      <p className="text-xs font-semibold text-yellow-400">{doc.titleEn}</p>
                      <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{doc.descHi}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigateTo('apply')}
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors min-h-[48px]"
              >
                <span>ऑनलाइन आवेदन भरें / Proceed to Application Form</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ==================== 5. SAFETY RULES ==================== */}
        {view === 'safety' && (
          <section className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                सुरक्षा नियम / Site Safety Rules
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Simna Construction में प्रत्येक कर्मचारी के लिए कार्यस्थल सुरक्षा सर्वोपरि है
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col">
                <div className="relative h-64 lg:h-full min-h-[260px]">
                  {!failedImages['safety-photo'] ? (
                    <img
                      src="/src/assets/images/work_welding_safety_1795626382341.jpg"
                      alt="Certified welder wearing yellow safety helmet, face shield, and protective gloves"
                      referrerPolicy="no-referrer"
                      onError={() => setFailedImages((p) => ({ ...p, 'safety-photo': true }))}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
                      <HardHat className="w-16 h-16 text-yellow-400/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-semibold text-yellow-400">Safety First · सुरक्षा पहले</p>
                    <p className="text-lg font-bold text-white">
                      बिना पीपीई (PPE) किट के साइट पर प्रवेश वर्जित है।
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    titleHi: 'सेफ़्टी हेलमेट',
                    titleEn: 'Safety Helmet',
                    descHi: 'कार्यस्थल पर हर समय मानक पीला/रंग-कोडित सेफ़्टी हेलमेट पहनना अनिवार्य है।',
                    icon: HardHat,
                  },
                  {
                    titleHi: 'सेफ़्टी जूते',
                    titleEn: 'Safety Shoes',
                    descHi: 'पैरों की सुरक्षा के लिए स्टील-टो वाले सेफ़्टी जूते पहनकर ही काम शुरू करें।',
                    icon: Footprints,
                  },
                  {
                    titleHi: 'सेफ़्टी यूनिफ़ॉर्म',
                    titleEn: 'Safety Uniform',
                    descHi: 'रिफ्लेक्टिव जैकेट, वेल्डिंग शील्ड, दस्ताने और फुल-बॉडी हार्नेस का उपयोग करें।',
                    icon: Flame,
                  },
                  {
                    titleHi: 'नियमित यूनिफ़ॉर्म',
                    titleEn: 'Regular Uniform',
                    descHi: 'कंपनी द्वारा निर्धारित साफ़ एवं पहचान योग्य कार्य यूनिफ़ॉर्म रोज़ पहनें।',
                    icon: Shirt,
                  },
                  {
                    titleHi: 'कंपनी सुरक्षा निर्देशों का पालन',
                    titleEn: 'Follow Company Safety Instructions',
                    descHi: 'सुपरवाइजर और सेफ़्टी ऑफिसर के सभी निर्देशों तथा टूलबॉक्स टॉक नियमों का सख्ती से पालन करें।',
                    icon: ShieldAlert,
                    spanFull: true,
                  },
                ].map((rule) => {
                  const Icon = rule.icon;
                  return (
                    <div
                      key={rule.titleEn}
                      className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 flex items-start gap-3.5 ${
                        rule.spanFull ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{rule.titleHi}</h2>
                        <p className="text-xs font-semibold text-yellow-400">{rule.titleEn}</p>
                        <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">{rule.descHi}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ==================== 6. OUR TEAM ==================== */}
        {view === 'team' && (
          <section className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                हमारी टीम / Our Leadership Team
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Simna Construction के अनुभवी प्रबंधक और संचालन प्रमुख
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {team.map((member) => {
                const initials = member.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <article
                    key={member.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-zinc-950 font-display text-2xl font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <span className="font-mono text-xs text-zinc-400 tabular-nums">
                          {member.experience}
                        </span>
                      </div>
                      <h2 className="mt-4 text-xl font-bold text-white">{member.name}</h2>
                      <p className="text-sm font-semibold text-yellow-400">{member.role}</p>
                      <p className="text-xs text-zinc-300 mt-0.5">{member.roleHi}</p>
                    </div>
                    <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400">
                      {member.department}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== 7. ABOUT COMPANY ==================== */}
        {view === 'about' && (
          <section className="max-w-4xl mx-auto space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4">
                <SimnaLogo size="lg" />
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    {company.companyName}
                  </h1>
                  <p className="text-sm sm:text-base font-semibold text-yellow-400">
                    {company.tagline}
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-800 pt-5">
                <div>
                  <h2 className="text-lg font-bold text-yellow-400">कंपनी परिचय (Hindi)</h2>
                  <p className="mt-1.5 text-base text-zinc-100 leading-relaxed">
                    {company.aboutHi}
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-yellow-400">About Us (English)</h2>
                  <p className="mt-1.5 text-sm sm:text-base text-zinc-300 leading-relaxed">
                    {company.aboutEn}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-sm font-bold text-white">Piping Work</div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Industrial pipeline fitting, welding, and testing.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-sm font-bold text-white">Structure Work</div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Steel fabrication, erection, and heavy trusses.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-sm font-bold text-white">All Work</div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Turnkey civil, mechanical, and site maintenance.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== 8. CONTACT US ==================== */}
        {view === 'contact' && (
          <section className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                संपर्क करें / Contact Us
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                भर्ती या कार्य से जुड़ी किसी भी सहायता के लिए सीधे कॉल या व्हाट्सएप करें
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-xs text-zinc-400">कंपनी मोबाइल नंबर / Mobile</div>
                <div className="font-mono text-base font-bold text-white tabular-nums">
                  {company.mobile}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs text-zinc-400">कंपनी ईमेल / Email</div>
                <div className="text-sm sm:text-base font-semibold text-white break-all">
                  {company.email}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-xs text-zinc-400">ऑफिस पता / Office Address</div>
                <div className="text-sm text-zinc-200 leading-relaxed">
                  {company.officeAddress}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href={`tel:${cleanPhone(company.mobile)}`}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-yellow-400 px-6 py-4 text-base font-bold text-zinc-950 hover:bg-yellow-300 transition-colors min-h-[56px]"
              >
                <Phone className="w-5 h-5" />
                <span>Call Now / अभी कॉल करें</span>
              </a>

              <a
                href={`https://wa.me/${cleanWhatsApp(company.whatsapp)}?text=${encodeURIComponent(
                  'नमस्ते Simna Construction, मुझे नौकरी आवेदन के बारे में जानकारी चाहिए।'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-zinc-950 hover:bg-emerald-400 transition-colors min-h-[56px]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp Contact / व्हाट्सएप करें</span>
              </a>
            </div>
          </section>
        )}

        {/* ==================== 9. APPLICATIONS & STATUS ==================== */}
        {view === 'applications' && (
          <section className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  आए आवेदन और स्थिति / Applications & Status
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  अपनी Application ID और मोबाइल नंबर से आवेदन की ताज़ा स्थिति जांचें
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <Lock className="w-4 h-4" />
                <span>Admin Panel खोलें (सभी आवेदन देखें)</span>
              </button>
            </div>

            {/* Aggregate Non-PII Live Counts */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-bold text-white">
                  कुल प्राप्त आवेदन / Live Application Summary
                </h2>
                <span className="font-mono text-lg font-bold text-yellow-400 tabular-nums">
                  {stats.totalApplications} Total
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {jobs.map((job) => {
                  const posStat = stats.byPosition.find((p) => p.applyingFor === job.title);
                  return (
                    <div
                      key={job.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5"
                    >
                      <div className="text-xs text-zinc-400">{job.title}</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                        {posStat?.totalCount ?? 0}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
                        {posStat?.acceptedCount ?? 0} Accepted · {posStat?.pendingCount ?? 0} Pending
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Applicant Status Lookup */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">
                आवेदन की स्थिति जांचें / Check Your Application Status
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runStatusLookup(lookupAppId, lookupMobile);
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                <input
                  type="text"
                  required
                  value={lookupAppId}
                  onChange={(e) => setLookupAppId(e.target.value)}
                  placeholder="Application ID (जैसे: SIMNA-26-123456)"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:border-yellow-400 focus:outline-none min-h-[46px]"
                />
                <input
                  type="tel"
                  required
                  value={lookupMobile}
                  onChange={(e) => setLookupMobile(e.target.value)}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:border-yellow-400 focus:outline-none min-h-[46px]"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors min-h-[46px]"
                >
                  <Search className="w-4 h-4" />
                  <span>{lookupLoading ? 'खोज रहे हैं...' : 'स्थिति देखें / Check'}</span>
                </button>
              </form>

              {lookupError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs sm:text-sm text-red-200">
                  {lookupError}
                </div>
              )}

              {lookupResult && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-yellow-400 tabular-nums">
                        {lookupResult.applicationId}
                      </div>
                      <h3 className="text-xl font-bold text-white">{lookupResult.fullName}</h3>
                      <p className="text-xs text-zinc-400">
                        Applied Position: {lookupResult.applyingFor}
                      </p>
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
                        lookupResult.status === 'Accepted'
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                          : lookupResult.status === 'Rejected'
                            ? 'bg-red-500/15 border border-red-500/40 text-red-300'
                            : 'bg-yellow-400/15 border border-yellow-400/40 text-yellow-300'
                      }`}
                    >
                      {lookupResult.status === 'Accepted' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : lookupResult.status === 'Rejected' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>
                        {lookupResult.status === 'Accepted'
                          ? 'स्वीकृत / Accepted'
                          : lookupResult.status === 'Rejected'
                            ? 'अस्वीकृत / Rejected'
                            : 'लंबित / Pending Review'}
                      </span>
                    </div>
                  </div>
                  {lookupResult.adminNote && (
                    <div className="pt-3 border-t border-zinc-800 text-sm text-zinc-200">
                      <span className="text-zinc-400">HR टिप्पणी / Note: </span>
                      {lookupResult.adminNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== ADMIN PANEL ==================== */}
        {view === 'admin' && (
          <AdminDashboard
            company={company}
            jobs={jobs}
            team={team}
            onDataUpdated={fetchBootstrap}
          />
        )}
      </main>

      <OfflineIndicator />

      {/* Fixed Bottom Navigation Bar (4 fixed buttons, compact 60px) */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-[#0B0C0E]/95 backdrop-blur-md pb-safe"
      >
        <div className="max-w-3xl mx-auto grid grid-cols-4 h-14">
          {(
            [
              { view: 'home', label: '🏠 Home', icon: Home },
              { view: 'vacancies', label: '💼 पद', icon: Briefcase },
              { view: 'apply', label: '📝 आवेदन', icon: ClipboardList },
              { view: 'contact', label: '📞 संपर्क', icon: Phone },
            ] as const
          ).map((tab) => {
            const active = view === tab.view;
            return (
              <button
                key={tab.view}
                type="button"
                onClick={() => navigateTo(tab.view)}
                className={`flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors min-h-[48px] ${
                  active ? 'text-yellow-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-sm sm:text-base leading-none">{tab.label}</span>
                <span
                  className={`h-1 w-6 rounded-full transition-opacity ${
                    active ? 'bg-yellow-400 opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
