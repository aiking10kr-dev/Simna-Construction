import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Eraser,
  FileCheck2,
  Lock,
  Send,
} from 'lucide-react';
import type { AppView, GenderOption, JobVacancy } from '../types.ts';

const EDUCATION_OPTIONS = [
  '8th Pass / आठवीं पास',
  '10th Pass / दसवीं पास',
  '12th Pass / बारहवीं पास',
  'ITI / Trade Certificate / आईटीआई',
  'Diploma / Engineering / डिप्लोमा',
  'Graduate / स्नातक',
  'Experienced / Skilled Worker / अनुभवी कारीगर',
];

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

interface ApplicationFormProps {
  jobs: JobVacancy[];
  preselectedJob: string;
  onSuccessSubmit: () => void;
  onTrackApplication: (applicationId: string, mobile: string) => void;
  onNavigate: (view: AppView) => void;
}

interface SubmittedReceipt {
  applicationId: string;
  fullName: string;
  applyingFor: string;
  mobile: string;
  createdAt: string;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobs,
  preselectedJob,
  onSuccessSubmit,
  onTrackApplication,
}) => {
  const defaultPosition = preselectedJob || jobs[0]?.title || 'Labour';

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [education, setEducation] = useState('');
  const [gender, setGender] = useState<GenderOption>('Male');
  const [pinCode, setPinCode] = useState('');
  const [stateName, setStateName] = useState('');
  const [applyingFor, setApplyingFor] = useState(defaultPosition);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateId, setDuplicateId] = useState('');
  const [receipt, setReceipt] = useState<SubmittedReceipt | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preselectedJob) {
      setApplyingFor(preselectedJob);
    }
  }, [preselectedJob]);

  const handleClear = () => {
    setFullName('');
    setAddress('');
    setMobile('');
    setEmail('');
    setEducation('');
    setGender('Male');
    setPinCode('');
    setStateName('');
    setApplyingFor(jobs[0]?.title || 'Labour');
    setErrorMsg('');
    setDuplicateId('');
  };

  const validateClient = (): string | null => {
    if (fullName.trim().length < 2) {
      return 'कृपया पूरा नाम दर्ज करें / Please enter your full name.';
    }
    if (address.trim().length < 5) {
      return 'कृपया पूरा पता लिखें / Please enter your complete address.';
    }
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें / Please enter a valid 10-digit Indian mobile number.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'कृपया सही ईमेल पता दर्ज करें / Please enter a valid email address.';
    }
    if (!education) {
      return 'कृपया शैक्षणिक योग्यता चुनें / Please select your education qualification.';
    }
    if (!/^\d{6}$/.test(pinCode.trim())) {
      return 'कृपया 6 अंकों का पिन कोड दर्ज करें / Please enter a valid 6-digit PIN code.';
    }
    if (!stateName) {
      return 'कृपया अपना राज्य चुनें / Please select your state.';
    }
    if (!applyingFor) {
      return 'कृपया पद चुनें / Please select the job position.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setDuplicateId('');

    const validationError = validateClient();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    setSubmitting(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          address: address.trim(),
          mobile: cleanMobile,
          email: email.trim(),
          education,
          gender,
          pinCode: pinCode.trim(),
          state: stateName,
          applyingFor,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        existingApplicationId?: string;
        applicationId?: string;
        fullName?: string;
        applyingFor?: string;
        createdAt?: string;
      };

      if (!response.ok) {
        setErrorMsg(data.error || 'आवेदन जमा करने में समस्या हुई / Failed to submit application.');
        if (data.existingApplicationId) {
          setDuplicateId(data.existingApplicationId);
        }
        return;
      }

      setReceipt({
        applicationId: data.applicationId || '',
        fullName: data.fullName || fullName.trim(),
        applyingFor: data.applyingFor || applyingFor,
        mobile: cleanMobile,
        createdAt: data.createdAt || new Date().toISOString(),
      });
      onSuccessSubmit();
    } catch {
      setErrorMsg('नेटवर्क त्रुटि। कृपया इंटरनेट जांचें और पुनः प्रयास करें / Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.applicationId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  if (receipt) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl border border-emerald-500/30 bg-zinc-900 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white">
            आवेदन सफलतापूर्वक जमा हो गया!
          </h2>
          <p className="mt-1 text-sm text-zinc-300">
            Application Submitted Successfully · Simna Construction
          </p>

          <div className="mt-6 w-full rounded-xl border border-yellow-400/30 bg-zinc-950 p-5">
            <p className="text-xs text-zinc-400">आपकी यूनिक एप्लिकेशन आईडी / Unique Application ID</p>
            <div className="mt-2 flex items-center justify-center gap-3 flex-wrap">
              <span className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-yellow-400 tabular-nums">
                {receipt.applicationId}
              </span>
              <button
                type="button"
                onClick={() => void handleCopyId()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-yellow-400/50 hover:text-yellow-300 transition-colors min-h-[40px]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy ID'}</span>
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3 text-left text-xs sm:text-sm">
              <div>
                <span className="text-zinc-500 block">आवेदक / Applicant</span>
                <span className="font-semibold text-zinc-100">{receipt.fullName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">पद / Position</span>
                <span className="font-semibold text-yellow-400">{receipt.applyingFor}</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
            कृपया अपनी Application ID सुरक्षित रखें। हमारी HR टीम आपके आवेदन की जांच कर आपसे संपर्क करेगी।
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
            <button
              type="button"
              onClick={() => onTrackApplication(receipt.applicationId, receipt.mobile)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors min-h-[48px]"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>स्थिति जांचें / Track Status</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                handleClear();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-700 transition-colors min-h-[48px]"
            >
              <span>नया आवेदन / New Form</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7 shadow-xl">
        <div className="border-b border-zinc-800 pb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            नौकरी के लिए ऑनलाइन आवेदन फ़ॉर्म
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Online Job Application Form · सभी जानकारी सही-सही भरें
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-yellow-400/25 bg-yellow-400/5 px-4 py-3 flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <strong className="text-yellow-300">गोपनीयता सुरक्षा:</strong> शुरुआती आवेदन में आधार नंबर (Aadhaar) या बैंक खाता विवरण नहीं लिया जाता है। नौकरी पक्की होने पर ही दस्तावेज़ सत्यापन होगा।
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm text-red-200">
              <p>{errorMsg}</p>
              {duplicateId && (
                <button
                  type="button"
                  onClick={() =>
                    onTrackApplication(duplicateId, mobile.replace(/\D/g, '').slice(-10))
                  }
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500/30 transition-colors"
                >
                  <span>आवेदन स्थिति देखें ({duplicateId})</span>
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 9. Applying For */}
            <div className="sm:col-span-2">
              <label htmlFor="applyingFor" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                किस पद के लिए आवेदन / Applying For <span className="text-yellow-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {jobs.map((job) => {
                  const selected = applyingFor === job.title;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setApplyingFor(job.title)}
                      className={`rounded-xl border p-3 text-left transition-all min-h-[56px] ${
                        selected
                          ? 'border-yellow-400 bg-yellow-400 text-zinc-950 shadow-sm'
                          : 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500'
                      }`}
                    >
                      <div className="font-bold text-sm">{job.title}</div>
                      <div
                        className={`text-xs font-mono tabular-nums mt-0.5 ${
                          selected ? 'text-zinc-900 font-semibold' : 'text-yellow-400'
                        }`}
                      >
                        {job.salaryDisplay}/माह
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                पूरा नाम / Full Name <span className="text-yellow-400">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="जैसे: रमेश कुमार / Ramesh Kumar"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none min-h-[46px]"
              />
            </div>

            {/* 3. Mobile Number */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                मोबाइल नंबर / Mobile Number <span className="text-yellow-400">*</span>
              </label>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                required
                maxLength={13}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10 अंकों का नंबर (जैसे: 9876543210)"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:border-yellow-400 focus:outline-none min-h-[46px]"
              />
            </div>

            {/* 4. Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                ईमेल पता / Email Address <span className="text-yellow-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none min-h-[46px]"
              />
            </div>

            {/* 6. Gender */}
            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-1.5">
                लिंग / Gender <span className="text-yellow-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Male', 'Female', 'Other'] as GenderOption[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`rounded-xl border py-2.5 px-2 text-xs sm:text-sm font-semibold transition-colors min-h-[46px] ${
                      gender === g
                        ? 'border-yellow-400 bg-yellow-400/15 text-yellow-300'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {g === 'Male' ? 'पुरुष / Male' : g === 'Female' ? 'महिला / Female' : 'अन्य / Other'}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Education Qualification */}
            <div>
              <label htmlFor="education" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                शैक्षणिक योग्यता / Education Qualification <span className="text-yellow-400">*</span>
              </label>
              <select
                id="education"
                required
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none min-h-[46px]"
              >
                <option value="">योग्यता चुनें / Select Education</option>
                {EDUCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. PIN Code */}
            <div>
              <label htmlFor="pinCode" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                पिन कोड / PIN Code <span className="text-yellow-400">*</span>
              </label>
              <input
                id="pinCode"
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 अंकों का पिन कोड (जैसे: 831013)"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:border-yellow-400 focus:outline-none min-h-[46px]"
              />
            </div>

            {/* 8. State */}
            <div className="sm:col-span-2">
              <label htmlFor="state" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                राज्य / State <span className="text-yellow-400">*</span>
              </label>
              <select
                id="state"
                required
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none min-h-[46px]"
              >
                <option value="">राज्य चुनें / Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Complete Address */}
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-semibold text-zinc-200 mb-1.5">
                पूरा पता / Complete Address <span className="text-yellow-400">*</span>
              </label>
              <textarea
                id="address"
                required
                rows={3}
                maxLength={300}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="गाँव / मोहल्ला, पोस्ट, थाना, जिला लिखें..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm sm:text-base font-bold text-zinc-950 hover:bg-yellow-300 disabled:opacity-60 active:scale-[0.99] transition-all min-h-[50px]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'जमा हो रहा है... / Submitting...' : 'आवेदन जमा करें / Submit Application'}</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors min-h-[50px] whitespace-nowrap"
            >
              <Eraser className="w-4 h-4" />
              <span>फ़ॉर्म साफ़ करें / Clear Form</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
