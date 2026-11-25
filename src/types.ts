export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected';

export type GenderOption = 'Male' | 'Female' | 'Other';

export interface JobVacancy {
  id: number;
  slug: string;
  title: string;
  titleHi: string;
  salaryAmount: number;
  salaryDisplay: string;
  description: string;
  descriptionHi: string;
  openingsCount: number;
  isActive: boolean;
  sortOrder: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  roleHi: string;
  department: string;
  experience: string;
  sortOrder: number;
}

export interface CompanyInfo {
  companyName: string;
  tagline: string;
  aboutEn: string;
  aboutHi: string;
  mobile: string;
  whatsapp: string;
  email: string;
  officeAddress: string;
  updatedAt: string;
}

export interface JobApplication {
  id: number;
  applicationId: string;
  fullName: string;
  address: string;
  mobile: string;
  email: string;
  education: string;
  gender: GenderOption;
  pinCode: string;
  state: string;
  applyingFor: string;
  status: ApplicationStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPositionStat {
  applyingFor: string;
  totalCount: number;
  acceptedCount: number;
  pendingCount: number;
}

export interface PublicBootstrapData {
  company: CompanyInfo;
  jobs: JobVacancy[];
  team: TeamMember[];
  stats: {
    totalApplications: number;
    byPosition: PublicPositionStat[];
  };
}

export interface AdminAuthStatus {
  envConfigured: boolean;
  claimed: boolean;
}

export interface ApplicationStatusLookup {
  applicationId: string;
  fullName: string;
  applyingFor: string;
  status: ApplicationStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export type AppView =
  | 'home'
  | 'apply'
  | 'vacancies'
  | 'work'
  | 'documents'
  | 'safety'
  | 'team'
  | 'about'
  | 'contact'
  | 'applications'
  | 'admin';
