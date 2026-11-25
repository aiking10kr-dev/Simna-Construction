import React, { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  Building2,
  Check,
  Download,
  Eye,
  KeyRound,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type {
  AdminAuthStatus,
  ApplicationStatus,
  CompanyInfo,
  JobApplication,
  JobVacancy,
  TeamMember,
} from '../types.ts';

interface AdminDashboardProps {
  company: CompanyInfo;
  jobs: JobVacancy[];
  team: TeamMember[];
  onDataUpdated: () => Promise<void>;
}

type AdminTab = 'applications' | 'jobs' | 'team' | 'company';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  company,
  jobs,
  team,
  onDataUpdated,
}) => {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [token, setToken] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTab>('applications');

  // Applications state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplication | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Jobs editing state
  const [adminJobs, setAdminJobs] = useState<JobVacancy[]>(jobs);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [jobDraft, setJobDraft] = useState<Partial<JobVacancy>>({});

  // Team editing state
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    roleHi: '',
    department: '',
    experience: '',
  });
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [memberDraft, setMemberDraft] = useState<Partial<TeamMember>>({});

  // Company editing state
  const [companyDraft, setCompanyDraft] = useState<CompanyInfo>(company);

  useEffect(() => {
    setCompanyDraft(company);
  }, [company]);

  useEffect(() => {
    setAdminJobs(jobs);
  }, [jobs]);

  const loadAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth-status');
      const data = (await res.json()) as AdminAuthStatus;
      setAuthStatus(data);
    } catch {
      setAuthError('Unable to reach server.');
    }
  }, []);

  useEffect(() => {
    void loadAuthStatus();
  }, [loadAuthStatus]);

  const fetchApplications = useCallback(
    async (authToken: string) => {
      if (!authToken) return;
      setAppsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (filterPosition !== 'All') params.set('position', filterPosition);
        if (filterStatus !== 'All') params.set('status', filterStatus);

        const res = await fetch(`/api/admin/applications?${params.toString()}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.status === 401) {
          setToken('');
          setAuthError('Session expired. Please log in again.');
          return;
        }
        const data = (await res.json()) as { applications?: JobApplication[] };
        setApplications(data.applications || []);
      } catch {
        setActionMessage('आवेदन लोड करने में त्रुटि / Failed to load applications.');
      } finally {
        setAppsLoading(false);
      }
    },
    [filterPosition, filterStatus, searchQuery]
  );

  const fetchAdminJobs = useCallback(async (authToken: string) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/admin/jobs', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { jobs?: JobVacancy[] };
        if (data.jobs) setAdminJobs(data.jobs);
      }
    } catch {
      // keep existing jobs
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchApplications(token);
      void fetchAdminJobs(token);
    }
  }, [token, fetchApplications, fetchAdminJobs]);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    window.setTimeout(() => setActionMessage(''), 3500);
  };

  const handleFirstRunSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (passwordInput.length < 6) {
      setAuthError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए / Password must be at least 6 characters.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('दोनों पासवर्ड मेल नहीं खा रहे / Passwords do not match.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Setup failed.');
        await loadAuthStatus();
        return;
      }
      setToken(data.token);
      setPasswordInput('');
      setConfirmPasswordInput('');
      await loadAuthStatus();
    } catch {
      setAuthError('Network error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Login failed.');
        return;
      }
      setToken(data.token);
      setPasswordInput('');
    } catch {
      setAuthError('Network error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: ApplicationStatus,
    note: string
  ) => {
    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(applicationId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNote: note }),
      });
      const data = (await res.json()) as { application?: JobApplication; error?: string };
      if (!res.ok || !data.application) {
        showToast(data.error || 'Status update failed.');
        return;
      }
      setApplications((prev) =>
        prev.map((a) => (a.applicationId === applicationId ? data.application! : a))
      );
      if (selectedApplicant?.applicationId === applicationId) {
        setSelectedApplicant(data.application);
      }
      await onDataUpdated();
      showToast(`आवेदन ${applicationId} को ${status} किया गया / Marked as ${status}.`);
    } catch {
      showToast('Failed to update status.');
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(applicationId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        showToast('Delete failed.');
        return;
      }
      setApplications((prev) => prev.filter((a) => a.applicationId !== applicationId));
      if (selectedApplicant?.applicationId === applicationId) {
        setSelectedApplicant(null);
      }
      await onDataUpdated();
      showToast(`Application ${applicationId} deleted.`);
    } catch {
      showToast('Delete failed.');
    }
  };

  const handleSaveJob = async (jobId: number) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobDraft),
      });
      const data = (await res.json()) as { job?: JobVacancy; error?: string };
      if (!res.ok || !data.job) {
        showToast(data.error || 'Job update failed.');
        return;
      }
      setAdminJobs((prev) => prev.map((j) => (j.id === jobId ? data.job! : j)));
      setEditingJobId(null);
      await onDataUpdated();
      showToast(`${data.job.title} updated successfully.`);
    } catch {
      showToast('Failed to update job.');
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMember),
      });
      const data = (await res.json()) as { member?: TeamMember; error?: string };
      if (!res.ok || !data.member) {
        showToast(data.error || 'Could not add member.');
        return;
      }
      setNewMember({ name: '', role: '', roleHi: '', department: '', experience: '' });
      await onDataUpdated();
      showToast(`Added ${data.member.name} to team.`);
    } catch {
      showToast('Failed to add team member.');
    }
  };

  const handleSaveTeamMember = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(memberDraft),
      });
      const data = (await res.json()) as { member?: TeamMember; error?: string };
      if (!res.ok || !data.member) {
        showToast(data.error || 'Update failed.');
        return;
      }
      setEditingMemberId(null);
      await onDataUpdated();
      showToast(`Updated ${data.member.name}.`);
    } catch {
      showToast('Update failed.');
    }
  };

  const handleDeleteTeamMember = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await onDataUpdated();
        showToast('Team member removed.');
      }
    } catch {
      showToast('Delete failed.');
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(companyDraft),
      });
      const data = (await res.json()) as { company?: CompanyInfo; error?: string };
      if (!res.ok || !data.company) {
        showToast(data.error || 'Update failed.');
        return;
      }
      await onDataUpdated();
      showToast('कंपनी और संपर्क जानकारी अपडेट हो गई / Company & Contact details updated.');
    } catch {
      showToast('Failed to save company details.');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Application ID',
      'Full Name',
      'Position',
      'Status',
      'Mobile',
      'Email',
      'Education',
      'Gender',
      'PIN Code',
      'State',
      'Address',
      'Submitted At',
    ];
    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const rows = applications.map((a) =>
      [
        a.applicationId,
        a.fullName,
        a.applyingFor,
        a.status,
        a.mobile,
        a.email,
        a.education,
        a.gender,
        a.pinCode,
        a.state,
        a.address,
        a.createdAt,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simna-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Unauthenticated Login / First-run setup gate
  if (!token) {
    const needsFirstRunClaim = authStatus && !authStatus.envConfigured && !authStatus.claimed;

    return (
      <div className="max-w-md mx-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {needsFirstRunClaim ? 'Admin Setup / एडमिन पासवर्ड सेट करें' : 'Admin Login / एडमिन लॉगिन'}
            </h2>
            <p className="text-xs text-zinc-400">Simna Construction Management Portal</p>
          </div>
        </div>

        {authError && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs sm:text-sm text-red-200">
            {authError}
          </div>
        )}

        {needsFirstRunClaim ? (
          <form onSubmit={(e) => void handleFirstRunSetup(e)} className="mt-6 space-y-4">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              पहली बार उपयोग के लिए अपना सुरक्षित एडमिन पासवर्ड बनाएं। यह पासवर्ड सर्वर पर एन्क्रिप्टेड रूप से सेव होगा।
            </p>
            <div>
              <label htmlFor="setup-pass" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                नया एडमिन पासवर्ड / Create Admin Password
              </label>
              <input
                id="setup-pass"
                type="password"
                required
                minLength={6}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="कम से कम 6 अक्षर / Min 6 characters"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none min-h-[46px]"
              />
            </div>
            <div>
              <label htmlFor="setup-confirm" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                पासवर्ड की पुष्टि करें / Confirm Password
              </label>
              <input
                id="setup-confirm"
                type="password"
                required
                minLength={6}
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="पासवर्ड दोबारा लिखें"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none min-h-[46px]"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors min-h-[48px]"
            >
              <KeyRound className="w-4 h-4" />
              <span>{authLoading ? 'सेव हो रहा है...' : 'पासवर्ड सेट करें और खोलें / Claim & Open Dashboard'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleLogin(e)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-pass" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                एडमिन पासवर्ड / Admin Password
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="पासवर्ड दर्ज करें / Enter password"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none min-h-[46px]"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors min-h-[48px]"
            >
              <KeyRound className="w-4 h-4" />
              <span>{authLoading ? 'जांच हो रही है...' : 'लॉगिन करें / Sign In'}</span>
            </button>
          </form>
        )}
      </div>
    );
  }

  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'Accepted').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
        <div>
          <h2 className="text-2xl font-bold text-white">एडमिन डैशबोर्ड / Admin Dashboard</h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Manage Applications · Vacancies & Salaries · Team · Company Contact
          </p>
        </div>
        <button
          type="button"
          onClick={() => setToken('')}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-200 hover:border-red-400/50 hover:text-red-300 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>लॉगआउट / Logout</span>
        </button>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-xs sm:text-sm font-medium text-yellow-200">
          {actionMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'applications', label: 'आए आवेदन / Applications', icon: Users },
            { id: 'jobs', label: 'पद व वेतन / Vacancies', icon: Briefcase },
            { id: 'team', label: 'हमारी टीम / Team', icon: Users },
            { id: 'company', label: 'कंपनी व संपर्क / Contact', icon: Building2 },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
                active
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-xs text-zinc-400">कुल आवेदन / Total</div>
              <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                {applications.length}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-xs text-zinc-400">लंबित / Pending</div>
              <div className="mt-1 font-mono text-2xl font-bold text-yellow-400 tabular-nums">
                {pendingCount}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-xs text-zinc-400">स्वीकृत / Accepted</div>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                {acceptedCount}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-xs text-zinc-400">अस्वीकृत / Rejected</div>
              <div className="mt-1 font-mono text-2xl font-bold text-red-400 tabular-nums">
                {rejectedCount}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="नाम, मोबाइल, ID या राज्य से खोजें / Search name, ID, mobile..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none min-h-[44px]"
                />
              </div>
              <select
                aria-label="Filter by job position"
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-yellow-400 focus:outline-none min-h-[44px]"
              >
                <option value="All">सभी पद / All Positions</option>
                {adminJobs.map((j) => (
                  <option key={j.id} value={j.title}>
                    {j.title}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-yellow-400 focus:outline-none min-h-[44px]"
              >
                <option value="All">सभी स्थिति / All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={applications.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-200 hover:border-yellow-400/50 hover:text-yellow-300 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {appsLoading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
              आवेदन लोड हो रहे हैं... / Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
              कोई आवेदन नहीं मिला / No job applications match your filters yet.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.applicationId}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono font-semibold text-yellow-400 tabular-nums">
                        {app.applicationId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{app.applyingFor}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          app.status === 'Accepted'
                            ? 'text-emerald-400'
                            : app.status === 'Rejected'
                              ? 'text-red-400'
                              : 'text-yellow-300'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{app.fullName}</h3>
                    <div className="text-xs sm:text-sm text-zinc-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="font-mono tabular-nums">{app.mobile}</span>
                      <span>{app.state} ({app.pinCode})</span>
                      <span>{app.education}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApplicant(app);
                        setAdminNoteInput(app.adminNote || '');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-yellow-400/50 hover:text-yellow-300 transition-colors min-h-[42px]"
                    >
                      <Eye className="w-4 h-4" />
                      <span>विवरण / Details</span>
                    </button>
                    {app.status !== 'Accepted' && (
                      <button
                        type="button"
                        onClick={() => void handleUpdateApplicationStatus(app.applicationId, 'Accepted', app.adminNote)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors min-h-[42px]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                    )}
                    {app.status !== 'Rejected' && (
                      <button
                        type="button"
                        onClick={() => void handleUpdateApplicationStatus(app.applicationId, 'Rejected', app.adminNote)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 border border-red-500/40 px-3.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/25 transition-colors min-h-[42px]"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDeleteApplication(app.applicationId)}
                      aria-label={`Delete ${app.applicationId}`}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors min-h-[42px] min-w-[42px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Applicant Details Modal */}
          {selectedApplicant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-5 sm:p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <span className="font-mono text-xs text-yellow-400 tabular-nums">
                      {selectedApplicant.applicationId}
                    </span>
                    <h3 className="text-2xl font-bold text-white">{selectedApplicant.fullName}</h3>
                    <p className="text-xs text-zinc-400">
                      Applied for {selectedApplicant.applyingFor} · Status: {selectedApplicant.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApplicant(null)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white"
                    aria-label="Close applicant details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                    <dt className="text-xs text-zinc-500">Mobile Number</dt>
                    <dd className="font-mono text-zinc-100 mt-0.5 tabular-nums">{selectedApplicant.mobile}</dd>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                    <dt className="text-xs text-zinc-500">Email Address</dt>
                    <dd className="text-zinc-100 mt-0.5 break-all">{selectedApplicant.email}</dd>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                    <dt className="text-xs text-zinc-500">Education</dt>
                    <dd className="text-zinc-100 mt-0.5">{selectedApplicant.education}</dd>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                    <dt className="text-xs text-zinc-500">Gender</dt>
                    <dd className="text-zinc-100 mt-0.5">{selectedApplicant.gender}</dd>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                    <dt className="text-xs text-zinc-500">State & PIN Code</dt>
                    <dd className="text-zinc-100 mt-0.5">
                      {selectedApplicant.state} — <span className="font-mono tabular-nums">{selectedApplicant.pinCode}</span>
                    </dd>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                    <dt className="text-xs text-zinc-500">Submitted On</dt>
                    <dd className="text-zinc-100 mt-0.5 font-mono text-xs tabular-nums">
                      {new Date(selectedApplicant.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-2 rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                    <dt className="text-xs text-zinc-500">Complete Address</dt>
                    <dd className="text-zinc-100 mt-0.5">{selectedApplicant.address}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <label htmlFor="admin-note" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    एडमिन टिप्पणी / Admin Note (Optional — visible to applicant on status check)
                  </label>
                  <input
                    id="admin-note"
                    type="text"
                    maxLength={300}
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="जैसे: डॉक्यूमेंट वेरिफिकेशन के लिए ऑफिस आएं"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-yellow-400 focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      void handleUpdateApplicationStatus(selectedApplicant.applicationId, 'Accepted', adminNoteInput)
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 min-h-[44px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>स्वीकृत करें / Accept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleUpdateApplicationStatus(selectedApplicant.applicationId, 'Rejected', adminNoteInput)
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-400 min-h-[44px]"
                  >
                    <X className="w-4 h-4" />
                    <span>अस्वीकृत करें / Reject</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VACANCIES & SALARIES */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminJobs.map((job) => {
            const isEditing = editingJobId === job.id;
            return (
              <div key={job.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Job Title (EN)</label>
                        <input
                          type="text"
                          value={jobDraft.title ?? ''}
                          onChange={(e) => setJobDraft((p) => ({ ...p, title: e.target.value }))}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">पद का नाम (HI)</label>
                        <input
                          type="text"
                          value={jobDraft.titleHi ?? ''}
                          onChange={(e) => setJobDraft((p) => ({ ...p, titleHi: e.target.value }))}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Monthly Salary (₹)</label>
                        <input
                          type="number"
                          value={jobDraft.salaryAmount ?? 0}
                          onChange={(e) => setJobDraft((p) => ({ ...p, salaryAmount: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Openings Count</label>
                        <input
                          type="number"
                          value={jobDraft.openingsCount ?? 0}
                          onChange={(e) => setJobDraft((p) => ({ ...p, openingsCount: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Description (EN)</label>
                      <textarea
                        rows={2}
                        value={jobDraft.description ?? ''}
                        onChange={(e) => setJobDraft((p) => ({ ...p, description: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">विवरण (HI)</label>
                      <textarea
                        rows={2}
                        value={jobDraft.descriptionHi ?? ''}
                        onChange={(e) => setJobDraft((p) => ({ ...p, descriptionHi: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-zinc-200">
                      <input
                        type="checkbox"
                        checked={jobDraft.isActive !== false}
                        onChange={(e) => setJobDraft((p) => ({ ...p, isActive: e.target.checked }))}
                        className="w-4 h-4 accent-yellow-400"
                      />
                      <span>Active Vacancy (visible to applicants)</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveJob(job.id)}
                        className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingJobId(null)}
                        className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-bold text-white">{job.title}</h3>
                        <p className="text-xs text-zinc-400">{job.titleHi}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xl font-bold text-yellow-400 tabular-nums">
                          {job.salaryDisplay}
                        </div>
                        <div className="text-xs text-zinc-400 tabular-nums">
                          {job.openingsCount} Openings · {job.isActive ? 'Active' : 'Paused'}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300">{job.description}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingJobId(job.id);
                        setJobDraft({ ...job });
                      }}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 text-xs sm:text-sm font-semibold text-yellow-400 hover:border-yellow-400/50 transition-colors min-h-[42px]"
                    >
                      वेतन / पद अपडेट करें (Edit Vacancy & Salary)
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: TEAM MEMBERS */}
      {activeTab === 'team' && (
        <div className="space-y-5">
          <form onSubmit={(e) => void handleAddTeamMember(e)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <h3 className="text-lg font-bold text-white">नया टीम सदस्य जोड़ें / Add Team Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name (e.g., Rohit Sharma)"
                value={newMember.name}
                onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
              <input
                type="text"
                required
                placeholder="Role in English (e.g., Safety Officer)"
                value={newMember.role}
                onChange={(e) => setNewMember((p) => ({ ...p, role: e.target.value }))}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
              <input
                type="text"
                placeholder="पद हिंदी में (जैसे: सुरक्षा अधिकारी)"
                value={newMember.roleHi}
                onChange={(e) => setNewMember((p) => ({ ...p, roleHi: e.target.value }))}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
              <input
                type="text"
                placeholder="Department (e.g., Piping / HSE)"
                value={newMember.department}
                onChange={(e) => setNewMember((p) => ({ ...p, department: e.target.value }))}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
              <input
                type="text"
                placeholder="Experience (e.g., 5+ Years)"
                value={newMember.experience}
                onChange={(e) => setNewMember((p) => ({ ...p, experience: e.target.value }))}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.map((member) => {
              const isEditing = editingMemberId === member.id;
              return (
                <div key={member.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
                  {isEditing ? (
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        value={memberDraft.name ?? ''}
                        onChange={(e) => setMemberDraft((p) => ({ ...p, name: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                      <input
                        type="text"
                        value={memberDraft.role ?? ''}
                        onChange={(e) => setMemberDraft((p) => ({ ...p, role: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                      <input
                        type="text"
                        value={memberDraft.roleHi ?? ''}
                        onChange={(e) => setMemberDraft((p) => ({ ...p, roleHi: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={memberDraft.department ?? ''}
                          onChange={(e) => setMemberDraft((p) => ({ ...p, department: e.target.value }))}
                          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="text"
                          value={memberDraft.experience ?? ''}
                          onChange={(e) => setMemberDraft((p) => ({ ...p, experience: e.target.value }))}
                          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveTeamMember(member.id)}
                          className="flex-1 rounded-xl bg-yellow-400 py-2 text-sm font-bold text-zinc-950"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(null)}
                          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{member.name}</h4>
                        <p className="text-sm text-yellow-400">{member.role}</p>
                        <p className="text-xs text-zinc-400">
                          {member.roleHi} · {member.department} · {member.experience}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setMemberDraft({ ...member });
                          }}
                          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-yellow-400/50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteTeamMember(member.id)}
                          aria-label={`Remove ${member.name}`}
                          className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: COMPANY & CONTACT */}
      {activeTab === 'company' && (
        <form onSubmit={(e) => void handleSaveCompany(e)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4">
          <h3 className="text-xl font-bold text-white">कंपनी और संपर्क जानकारी अपडेट करें / Company & Contact Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Company Name</label>
              <input
                type="text"
                required
                value={companyDraft.companyName}
                onChange={(e) => setCompanyDraft((p) => ({ ...p, companyName: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Tagline</label>
              <input
                type="text"
                required
                value={companyDraft.tagline}
                onChange={(e) => setCompanyDraft((p) => ({ ...p, tagline: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Company Mobile Number (Call Now)</label>
              <input
                type="text"
                required
                value={companyDraft.mobile}
                onChange={(e) => setCompanyDraft((p) => ({ ...p, mobile: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white font-mono min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">WhatsApp Number</label>
              <input
                type="text"
                required
                value={companyDraft.whatsapp}
                onChange={(e) => setCompanyDraft((p) => ({ ...p, whatsapp: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white font-mono min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Company Email</label>
              <input
                type="email"
                required
                value={companyDraft.email}
                onChange={(e) => setCompanyDraft((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Office Address</label>
              <input
                type="text"
                required
                value={companyDraft.officeAddress}
                onChange={(e) => setCompanyDraft((p) => ({ ...p, officeAddress: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white min-h-[44px]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">About Company (Hindi)</label>
              <textarea
                rows={3}
                value={companyDraft.aboutHi}
                onChange={(e) => setCompanyDraft((p) => ({ ...p, aboutHi: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">About Company (English)</label>
              <textarea
                rows={3}
                value={companyDraft.aboutEn}
                onChange={(e) => setCompanyDraft((p) => ({ ...p, aboutEn: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors min-h-[48px]"
          >
            <span>जानकारी सेव करें / Save Company & Contact Details</span>
          </button>
        </form>
      )}
    </div>
  );
};
