import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createSeedDatabase, formatDateISO } from '../data/seedData';
import { t } from '../i18n/translations';
import {
  AppDatabase,
  Booking,
  Branch,
  CustomerPage,
  InstallationChecklist,
  InstallationJob,
  IssueTypeOption,
  Language,
  ProductModel,
  ServiceTicket,
  StaffPage,
  StaffUser,
  Technician,
  TicketStatus,
  TimeSlotRule,
  ToastMessage,
  UserRole,
  WarrantyRecord,
} from '../types';

const STORAGE_KEY = 'aurelia_smart_security_db_v2';
const LEGACY_STORAGE_KEY = 'aurelia_smart_security_db_v1';
const ROLE_STORAGE_KEY = 'aurelia_smart_security_role_v1';
const LANG_STORAGE_KEY = 'aurelia_smart_security_lang_v1';

interface AppContextValue {
  db: AppDatabase;
  lang: Language;
  setLang: (lang: Language) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  customerPage: CustomerPage;
  setCustomerPage: (page: CustomerPage) => void;
  staffPage: StaffPage;
  setStaffPage: (page: StaffPage) => void;
  activeTechnicianId: string;
  setActiveTechnicianId: (id: string) => void;
  ticketFilterPreset: TicketStatus | 'All';
  setTicketFilterPreset: (status: TicketStatus | 'All') => void;
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Actions
  createBooking: (
    data: Omit<Booking, 'id' | 'bookingCode' | 'createdAt' | 'status'> & { status?: Booking['status'] }
  ) => Booking;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;

  createTicket: (
    data: Omit<
      ServiceTicket,
      'id' | 'ticketNumber' | 'status' | 'priority' | 'internalNotes' | 'createdAt' | 'updatedAt'
    > & {
      priority?: ServiceTicket['priority'];
    }
  ) => ServiceTicket;
  updateTicket: (id: string, patch: Partial<ServiceTicket>) => void;
  addTicketNote: (ticketId: string, text: string) => void;

  registerWarranty: (
    data: Omit<WarrantyRecord, 'id' | 'expiryDate' | 'registeredAt'>
  ) => WarrantyRecord;
  lookupWarranty: (serialNumber: string) => WarrantyRecord | undefined;

  createInstallationJob: (
    data: Omit<InstallationJob, 'id' | 'jobCode' | 'status' | 'checklist' | 'createdAt'>
  ) => InstallationJob;
  toggleInstallationStep: (jobId: string, step: keyof InstallationChecklist) => void;
  updateInstallationJob: (jobId: string, patch: Partial<InstallationJob>) => void;

  // Settings Actions
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  addTimeSlotRule: (rule: Omit<TimeSlotRule, 'id'>) => void;
  updateTimeSlotRule: (id: string, patch: Partial<TimeSlotRule>) => void;
  addTechnician: (tech: Omit<Technician, 'id'>) => void;
  updateTechnician: (id: string, patch: Partial<Technician>) => void;
  addStaffUser: (staff: Omit<StaffUser, 'id'>) => void;
  updateStaffUser: (id: string, patch: Partial<StaffUser>) => void;
  addProduct: (product: Omit<ProductModel, 'id'>) => void;
  updateProduct: (id: string, patch: Partial<ProductModel>) => void;
  addIssueType: (issue: Omit<IssueTypeOption, 'id'>) => void;
  updateIssueType: (id: string, patch: Partial<IssueTypeOption>) => void;

  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Gracefully migrate legacy v1 records (or partial records lacking nameZh / staffUsers)
function migrateDatabase(rawParsed: Record<string, unknown>): AppDatabase {
  const seed = createSeedDatabase();

  const rawTechs = Array.isArray(rawParsed.technicians) ? rawParsed.technicians : seed.technicians;
  const technicians: Technician[] = rawTechs.map((tc: Record<string, unknown>) => ({
    id: String(tc.id || `tech-${Date.now()}`),
    nameEn: String(tc.nameEn || tc.name || ''),
    nameZh: String(tc.nameZh || ''),
    phone: String(tc.phone || ''),
    branchId: String(tc.branchId || 'br-central'),
    specialties: Array.isArray(tc.specialties) ? (tc.specialties as Technician['specialties']) : ['Smart Lock'],
    active: tc.active !== false,
  }));

  const rawProducts = Array.isArray(rawParsed.products) ? rawParsed.products : seed.products;
  const products: ProductModel[] = rawProducts.map((p: Record<string, unknown>) => ({
    id: String(p.id),
    nameEn: String(p.nameEn || p.name || ''),
    nameZh: String(p.nameZh || p.nameEn || p.name || ''),
    category: (p.category as ProductModel['category']) || 'Smart Lock',
    tier: p.tier as ProductModel['tier'],
    price: Number(p.price || 0),
    warrantyMonths: Number(p.warrantyMonths || 24),
    highlightsEn: String(p.highlightsEn || ''),
    highlightsZh: String(p.highlightsZh || p.highlightsEn || ''),
    imageUrl: String(p.imageUrl || ''),
    active: p.active !== false,
  }));

  const normalizeIssueKey = (k: unknown): string => {
    const s = String(k || 'other');
    if (s === 'wont_unlock') return 'won_t_unlock';
    if (s === 'fingerprint') return 'fingerprint_not_reading';
    return s;
  };

  const rawBookings = Array.isArray(rawParsed.bookings) ? rawParsed.bookings : seed.bookings;
  const bookings: Booking[] = rawBookings.map((b: Record<string, unknown>) => ({
    id: String(b.id),
    bookingCode: String(b.bookingCode),
    type: (b.type as Booking['type']) || 'Demo',
    status: (b.status as Booking['status']) || 'Confirmed',
    productInterest: (b.productInterest as Booking['productInterest']) || 'Smart Lock',
    productModelId: b.productModelId ? String(b.productModelId) : undefined,
    branchId: String(b.branchId || 'br-central'),
    date: String(b.date),
    timeSlot: String(b.timeSlot),
    customerNameEn: String(b.customerNameEn || b.customerName || ''),
    customerNameZh: String(b.customerNameZh || ''),
    customerMobile: String(b.customerMobile || ''),
    customerAddressEn: b.customerAddressEn
      ? String(b.customerAddressEn)
      : b.customerAddress
      ? String(b.customerAddress)
      : undefined,
    customerAddressZh: b.customerAddressZh ? String(b.customerAddressZh) : undefined,
    preferredLanguage: b.preferredLanguage === 'zh' ? 'zh' : 'en',
    technicianId: b.technicianId ? String(b.technicianId) : undefined,
    notesEn: b.notesEn ? String(b.notesEn) : b.notes ? String(b.notes) : undefined,
    notesZh: b.notesZh ? String(b.notesZh) : undefined,
    completionPhotoUrl: b.completionPhotoUrl ? String(b.completionPhotoUrl) : undefined,
    createdAt: String(b.createdAt || formatDateISO(new Date())),
  }));

  const rawTickets = Array.isArray(rawParsed.tickets) ? rawParsed.tickets : seed.tickets;
  const tickets: ServiceTicket[] = rawTickets.map((tk: Record<string, unknown>) => ({
    id: String(tk.id),
    ticketNumber: String(tk.ticketNumber),
    customerNameEn: String(tk.customerNameEn || tk.customerName || ''),
    customerNameZh: String(tk.customerNameZh || ''),
    customerMobile: String(tk.customerMobile || ''),
    addressEn: String(tk.addressEn || tk.address || ''),
    addressZh: tk.addressZh ? String(tk.addressZh) : undefined,
    productModelId: String(tk.productModelId || 'prod-lock-mid'),
    serialNumber: tk.serialNumber ? String(tk.serialNumber) : undefined,
    issueType: normalizeIssueKey(tk.issueType),
    descriptionEn: String(tk.descriptionEn || tk.description || ''),
    descriptionZh: tk.descriptionZh ? String(tk.descriptionZh) : undefined,
    photoUrl: tk.photoUrl ? String(tk.photoUrl) : undefined,
    completionPhotoUrl: tk.completionPhotoUrl ? String(tk.completionPhotoUrl) : undefined,
    status: (tk.status as TicketStatus) || 'New',
    priority: (tk.priority as ServiceTicket['priority']) || 'Medium',
    assignedTechnicianId: tk.assignedTechnicianId ? String(tk.assignedTechnicianId) : undefined,
    branchId: String(tk.branchId || 'br-central'),
    scheduledDate: tk.scheduledDate ? String(tk.scheduledDate) : undefined,
    scheduledSlot: tk.scheduledSlot ? String(tk.scheduledSlot) : undefined,
    internalNotes: Array.isArray(tk.internalNotes)
      ? tk.internalNotes.map((n: Record<string, unknown>) => ({
          id: String(n.id),
          authorNameEn: String(n.authorNameEn || n.author || 'Staff'),
          authorNameZh: String(n.authorNameZh || ''),
          authorRole: String(n.authorRole || 'staff'),
          createdAt: String(n.createdAt || ''),
          textEn: String(n.textEn || n.text || ''),
          textZh: n.textZh ? String(n.textZh) : undefined,
        }))
      : [],
    resolutionNotesEn: tk.resolutionNotesEn
      ? String(tk.resolutionNotesEn)
      : tk.resolutionNotes
      ? String(tk.resolutionNotes)
      : undefined,
    resolutionNotesZh: tk.resolutionNotesZh ? String(tk.resolutionNotesZh) : undefined,
    customerSignature: tk.customerSignature ? String(tk.customerSignature) : undefined,
    createdAt: String(tk.createdAt || ''),
    updatedAt: String(tk.updatedAt || ''),
  }));

  const rawWarranties = Array.isArray(rawParsed.warranties) ? rawParsed.warranties : seed.warranties;
  const warranties: WarrantyRecord[] = rawWarranties.map((w: Record<string, unknown>) => ({
    id: String(w.id),
    serialNumber: String(w.serialNumber),
    productModelId: String(w.productModelId || 'prod-lock-mid'),
    purchaseDate: String(w.purchaseDate),
    expiryDate: String(w.expiryDate),
    branchId: String(w.branchId || 'br-central'),
    customerNameEn: String(w.customerNameEn || w.customerName || ''),
    customerNameZh: String(w.customerNameZh || ''),
    customerMobile: String(w.customerMobile || ''),
    customerEmail: w.customerEmail ? String(w.customerEmail) : undefined,
    registeredAt: String(w.registeredAt || ''),
  }));

  const rawInstalls = Array.isArray(rawParsed.installationJobs)
    ? rawParsed.installationJobs
    : seed.installationJobs;
  const installationJobs: InstallationJob[] = rawInstalls.map((j: Record<string, unknown>) => ({
    id: String(j.id),
    jobCode: String(j.jobCode),
    saleReference: String(j.saleReference),
    productModelId: String(j.productModelId || 'prod-lock-mid'),
    customerNameEn: String(j.customerNameEn || j.customerName || ''),
    customerNameZh: String(j.customerNameZh || ''),
    customerMobile: String(j.customerMobile || ''),
    addressEn: String(j.addressEn || j.address || ''),
    addressZh: j.addressZh ? String(j.addressZh) : undefined,
    branchId: String(j.branchId || 'br-central'),
    preferredDate: String(j.preferredDate),
    timeSlot: String(j.timeSlot || '10:00'),
    assignedTechnicianId: String(j.assignedTechnicianId || 'tech-1'),
    status: (j.status as InstallationJob['status']) || 'Scheduled',
    checklist: (j.checklist as InstallationChecklist) || {
      siteCheck: false,
      mounting: false,
      programming: false,
      customerDemo: false,
      signOff: false,
    },
    notesEn: j.notesEn ? String(j.notesEn) : j.notes ? String(j.notes) : undefined,
    notesZh: j.notesZh ? String(j.notesZh) : undefined,
    completionPhotoUrl: j.completionPhotoUrl ? String(j.completionPhotoUrl) : undefined,
    customerSignature: j.customerSignature ? String(j.customerSignature) : undefined,
    createdAt: String(j.createdAt || ''),
  }));

  return {
    staffUsers: Array.isArray(rawParsed.staffUsers)
      ? (rawParsed.staffUsers as StaffUser[])
      : seed.staffUsers,
    branches: Array.isArray(rawParsed.branches) ? (rawParsed.branches as Branch[]) : seed.branches,
    technicians,
    products,
    timeSlotRules: Array.isArray(rawParsed.timeSlotRules)
      ? (rawParsed.timeSlotRules as TimeSlotRule[])
      : seed.timeSlotRules,
    issueTypes: seed.issueTypes,
    bookings,
    tickets,
    warranties,
    installationJobs,
  };
}

function loadInitialDb(): AppDatabase {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Record<string, unknown>;
      if (parsed && Array.isArray(parsed.branches) && Array.isArray(parsed.bookings)) {
        return migrateDatabase(parsed);
      }
    }
    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1) as Record<string, unknown>;
      if (parsedV1 && Array.isArray(parsedV1.bookings)) {
        // Seed fresh v2 records while preserving any user-created v1 items lacking v2 fields
        const seed = createSeedDatabase();
        const seedBookingIds = new Set(seed.bookings.map((b) => b.id));
        const migrated = migrateDatabase(parsedV1);
        const userCreatedBookings = migrated.bookings.filter((b) => !seedBookingIds.has(b.id));
        const seedTicketIds = new Set(seed.tickets.map((tk) => tk.id));
        const userCreatedTickets = migrated.tickets.filter((tk) => !seedTicketIds.has(tk.id));
        return {
          ...seed,
          bookings: [...userCreatedBookings, ...seed.bookings],
          tickets: [...userCreatedTickets, ...seed.tickets],
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return createSeedDatabase();
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase>(loadInitialDb);
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'zh' ? 'zh' : 'en';
    } catch {
      return 'en';
    }
  });
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
      if (
        saved === 'customer' ||
        saved === 'admin' ||
        saved === 'front_desk' ||
        saved === 'technician'
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'customer';
  });

  const [customerPage, setCustomerPage] = useState<CustomerPage>('book-demo');
  const [staffPage, setStaffPage] = useState<StaffPage>(() =>
    role === 'technician' ? 'technician' : 'dashboard'
  );
  const [activeTechnicianId, setActiveTechnicianId] = useState<string>('tech-1');
  const [ticketFilterPreset, setTicketFilterPreset] = useState<TicketStatus | 'All'>('All');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore quota errors
    }
  }, [db]);

  // Sync document title and html lang attribute
  useEffect(() => {
    document.title = `${t(lang, 'brandName')} — ${t(lang, 'pageTitleSuffix')}`;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const setRole = useCallback((nextRole: UserRole) => {
    setRoleState(nextRole);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
    } catch {
      // ignore
    }
    if (nextRole === 'technician') {
      setStaffPage('technician');
    } else if (nextRole === 'admin' || nextRole === 'front_desk') {
      setStaffPage((prev) => (prev === 'technician' ? 'dashboard' : prev));
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  const nowStamp = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${formatDateISO(d)} ${hh}:${mm}`;
  };

  const createBooking: AppContextValue['createBooking'] = useCallback((data) => {
    const prefix = data.type === 'Demo' ? 'DM' : data.type === 'Installation' ? 'IN' : 'RP';
    const randomNum = Math.floor(2100 + Math.random() * 7800);
    const booking: Booking = {
      ...data,
      id: `bk-${Date.now()}`,
      bookingCode: `AUR-${prefix}-${randomNum}`,
      status: data.status || 'Confirmed',
      createdAt: formatDateISO(new Date()),
    };
    setDb((prev) => ({
      ...prev,
      bookings: [booking, ...prev.bookings],
    }));
    return booking;
  }, []);

  const updateBooking: AppContextValue['updateBooking'] = useCallback((id, patch) => {
    setDb((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const cancelBooking: AppContextValue['cancelBooking'] = useCallback((id) => {
    setDb((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, status: 'Cancelled' } : b)),
    }));
  }, []);

  const createTicket: AppContextValue['createTicket'] = useCallback(
    (data) => {
      const issueMeta = db.issueTypes.find((i) => i.key === data.issueType);
      const num = Math.floor(3100 + Math.random() * 6800);
      const stamp = nowStamp();
      const ticket: ServiceTicket = {
        ...data,
        id: `tk-${Date.now()}`,
        ticketNumber: `TKT-${num}`,
        status: 'New',
        priority: data.priority || issueMeta?.defaultPriority || 'Medium',
        internalNotes: [],
        createdAt: stamp,
        updatedAt: stamp,
      };
      setDb((prev) => ({
        ...prev,
        tickets: [ticket, ...prev.tickets],
      }));
      return ticket;
    },
    [db.issueTypes]
  );

  const updateTicket: AppContextValue['updateTicket'] = useCallback((id, patch) => {
    const stamp = nowStamp();
    setDb((prev) => ({
      ...prev,
      tickets: prev.tickets.map((tk) => (tk.id === id ? { ...tk, ...patch, updatedAt: stamp } : tk)),
    }));
  }, []);

  const addTicketNote: AppContextValue['addTicketNote'] = useCallback(
    (ticketId, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const stamp = nowStamp();

      let authorNameEn = 'Staff';
      let authorNameZh = '工作人员';

      if (role === 'admin' || role === 'front_desk') {
        const staff = db.staffUsers.find((u) => u.role === role);
        if (staff) {
          authorNameEn = staff.nameEn;
          authorNameZh = staff.nameZh;
        }
      } else if (role === 'technician') {
        const tech = db.technicians.find((tc) => tc.id === activeTechnicianId);
        if (tech) {
          authorNameEn = tech.nameEn;
          authorNameZh = tech.nameZh;
        }
      }

      setDb((prev) => ({
        ...prev,
        tickets: prev.tickets.map((tk) =>
          tk.id === ticketId
            ? {
                ...tk,
                updatedAt: stamp,
                internalNotes: [
                  ...tk.internalNotes,
                  {
                    id: `note-${Date.now()}`,
                    authorNameEn,
                    authorNameZh,
                    authorRole: role,
                    createdAt: stamp,
                    textEn: trimmed,
                    textZh: trimmed,
                  },
                ],
              }
            : tk
        ),
      }));
    },
    [activeTechnicianId, db.staffUsers, db.technicians, role]
  );

  const registerWarranty: AppContextValue['registerWarranty'] = useCallback(
    (data) => {
      const product = db.products.find((p) => p.id === data.productModelId);
      const months = product?.warrantyMonths || 24;
      const purchase = new Date(data.purchaseDate);
      const expiry = new Date(purchase);
      expiry.setMonth(expiry.getMonth() + months);

      const record: WarrantyRecord = {
        ...data,
        serialNumber: data.serialNumber.trim().toUpperCase(),
        id: `war-${Date.now()}`,
        expiryDate: formatDateISO(expiry),
        registeredAt: formatDateISO(new Date()),
      };
      setDb((prev) => ({
        ...prev,
        warranties: [record, ...prev.warranties.filter((w) => w.serialNumber !== record.serialNumber)],
      }));
      return record;
    },
    [db.products]
  );

  const lookupWarranty = useCallback(
    (serialNumber: string) => {
      const normalized = serialNumber.trim().toUpperCase();
      return db.warranties.find((w) => w.serialNumber.toUpperCase() === normalized);
    },
    [db.warranties]
  );

  const createInstallationJob: AppContextValue['createInstallationJob'] = useCallback(
    (data) => {
      const code = `INS-${Math.floor(5100 + Math.random() * 4800)}`;
      const job: InstallationJob = {
        ...data,
        id: `inst-${Date.now()}`,
        jobCode: code,
        status: 'Scheduled',
        checklist: {
          siteCheck: false,
          mounting: false,
          programming: false,
          customerDemo: false,
          signOff: false,
        },
        createdAt: formatDateISO(new Date()),
      };

      const prod = db.products.find((p) => p.id === data.productModelId);
      const linkedBooking: Booking = {
        id: `bk-inst-${Date.now()}`,
        bookingCode: `AUR-IN-${Math.floor(2100 + Math.random() * 7800)}`,
        type: 'Installation',
        status: 'Confirmed',
        productInterest: prod?.category || 'Smart Lock',
        productModelId: data.productModelId,
        branchId: data.branchId,
        date: data.preferredDate,
        timeSlot: data.timeSlot,
        customerNameEn: data.customerNameEn,
        customerNameZh: data.customerNameZh,
        customerMobile: data.customerMobile,
        customerAddressEn: data.addressEn,
        customerAddressZh: data.addressZh,
        preferredLanguage: lang,
        technicianId: data.assignedTechnicianId,
        notesEn: data.notesEn,
        notesZh: data.notesZh,
        createdAt: formatDateISO(new Date()),
      };

      setDb((prev) => ({
        ...prev,
        installationJobs: [job, ...prev.installationJobs],
        bookings: [linkedBooking, ...prev.bookings],
      }));
      return job;
    },
    [db.products, lang]
  );

  const toggleInstallationStep: AppContextValue['toggleInstallationStep'] = useCallback(
    (jobId, step) => {
      setDb((prev) => ({
        ...prev,
        installationJobs: prev.installationJobs.map((job) => {
          if (job.id !== jobId) return job;
          const nextChecklist = { ...job.checklist, [step]: !job.checklist[step] };
          const values = Object.values(nextChecklist);
          const allDone = values.every(Boolean);
          const anyDone = values.some(Boolean);
          const nextStatus: InstallationJob['status'] = allDone
            ? 'Completed'
            : anyDone
            ? 'In Progress'
            : 'Scheduled';
          return { ...job, checklist: nextChecklist, status: nextStatus };
        }),
      }));
    },
    []
  );

  const updateInstallationJob: AppContextValue['updateInstallationJob'] = useCallback(
    (jobId, patch) => {
      setDb((prev) => ({
        ...prev,
        installationJobs: prev.installationJobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)),
      }));
    },
    []
  );

  const addBranch: AppContextValue['addBranch'] = useCallback((branch) => {
    setDb((prev) => ({
      ...prev,
      branches: [...prev.branches, { ...branch, id: `br-${Date.now()}` }],
    }));
  }, []);

  const updateBranch: AppContextValue['updateBranch'] = useCallback((id, patch) => {
    setDb((prev) => ({
      ...prev,
      branches: prev.branches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const addTimeSlotRule: AppContextValue['addTimeSlotRule'] = useCallback((rule) => {
    setDb((prev) => ({
      ...prev,
      timeSlotRules: [...prev.timeSlotRules, { ...rule, id: `slot-${Date.now()}` }],
    }));
  }, []);

  const updateTimeSlotRule: AppContextValue['updateTimeSlotRule'] = useCallback((id, patch) => {
    setDb((prev) => ({
      ...prev,
      timeSlotRules: prev.timeSlotRules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const addTechnician: AppContextValue['addTechnician'] = useCallback((tech) => {
    setDb((prev) => ({
      ...prev,
      technicians: [...prev.technicians, { ...tech, id: `tech-${Date.now()}` }],
    }));
  }, []);

  const updateTechnician: AppContextValue['updateTechnician'] = useCallback((id, patch) => {
    setDb((prev) => ({
      ...prev,
      technicians: prev.technicians.map((tc) => (tc.id === id ? { ...tc, ...patch } : tc)),
    }));
  }, []);

  const addStaffUser: AppContextValue['addStaffUser'] = useCallback((staff) => {
    setDb((prev) => ({
      ...prev,
      staffUsers: [...prev.staffUsers, { ...staff, id: `staff-${Date.now()}` }],
    }));
  }, []);

  const updateStaffUser: AppContextValue['updateStaffUser'] = useCallback((id, patch) => {
    setDb((prev) => ({
      ...prev,
      staffUsers: prev.staffUsers.map((su) => (su.id === id ? { ...su, ...patch } : su)),
    }));
  }, []);

  const addProduct: AppContextValue['addProduct'] = useCallback((product) => {
    setDb((prev) => ({
      ...prev,
      products: [...prev.products, { ...product, id: `prod-${Date.now()}` }],
    }));
  }, []);

  const updateProduct: AppContextValue['updateProduct'] = useCallback((id, patch) => {
    setDb((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const addIssueType: AppContextValue['addIssueType'] = useCallback((issue) => {
    setDb((prev) => ({
      ...prev,
      issueTypes: [...prev.issueTypes, { ...issue, id: `iss-${Date.now()}` }],
    }));
  }, []);

  const updateIssueType: AppContextValue['updateIssueType'] = useCallback((id, patch) => {
    setDb((prev) => ({
      ...prev,
      issueTypes: prev.issueTypes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = createSeedDatabase();
    setDb(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }
    pushToast({
      title: t(lang, 'resetSuccess'),
      variant: 'info',
    });
  }, [lang, pushToast]);

  return (
    <AppContext.Provider
      value={{
        db,
        lang,
        setLang,
        role,
        setRole,
        customerPage,
        setCustomerPage,
        staffPage,
        setStaffPage,
        activeTechnicianId,
        setActiveTechnicianId,
        ticketFilterPreset,
        setTicketFilterPreset,
        toasts,
        pushToast,
        dismissToast,
        createBooking,
        updateBooking,
        cancelBooking,
        createTicket,
        updateTicket,
        addTicketNote,
        registerWarranty,
        lookupWarranty,
        createInstallationJob,
        toggleInstallationStep,
        updateInstallationJob,
        addBranch,
        updateBranch,
        addTimeSlotRule,
        updateTimeSlotRule,
        addTechnician,
        updateTechnician,
        addStaffUser,
        updateStaffUser,
        addProduct,
        updateProduct,
        addIssueType,
        updateIssueType,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
