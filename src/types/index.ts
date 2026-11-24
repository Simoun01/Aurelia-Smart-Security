export type Language = 'en' | 'zh';

export type UserRole = 'customer' | 'admin' | 'front_desk' | 'technician';

export type CustomerPage = 'book-demo' | 'request-service' | 'warranty';

export type StaffPage =
  | 'dashboard'
  | 'calendar'
  | 'tickets'
  | 'technician'
  | 'installations'
  | 'settings';

export type ProductCategory =
  | 'Smart Lock'
  | 'Smart Door'
  | 'CCTV & Alarm'
  | 'Video Doorbell';

export type LockTier = 'Entry' | 'Mid-Range' | 'Flagship';

export interface PersonName {
  nameEn: string;
  nameZh: string;
}

export interface StaffUser extends PersonName {
  id: string;
  role: 'admin' | 'front_desk';
  email: string;
  branchId: string;
  active: boolean;
}

export interface Branch {
  id: string;
  nameEn: string;
  nameZh: string;
  addressEn: string;
  addressZh: string;
  phone: string;
  hours: string;
  demoBays: number;
  active: boolean;
}

export interface Technician extends PersonName {
  id: string;
  phone: string;
  branchId: string;
  specialties: ProductCategory[];
  active: boolean;
}

export interface ProductModel {
  id: string;
  nameEn: string;
  nameZh: string;
  category: ProductCategory;
  tier?: LockTier;
  price: number;
  warrantyMonths: number;
  highlightsEn: string;
  highlightsZh: string;
  imageUrl: string;
  active: boolean;
}

export interface TimeSlotRule {
  id: string;
  startTime: string;
  endTime: string;
  maxConcurrentDemos: number;
  enabled: boolean;
}

export interface IssueTypeOption {
  id: string;
  key: string;
  labelEn: string;
  labelZh: string;
  defaultPriority: TicketPriority;
}

export type BookingType = 'Demo' | 'Installation' | 'Repair';

export type BookingStatus = 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  bookingCode: string;
  type: BookingType;
  status: BookingStatus;
  productInterest: ProductCategory;
  productModelId?: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00"
  customerNameEn: string;
  customerNameZh: string;
  customerMobile: string;
  customerAddressEn?: string;
  customerAddressZh?: string;
  preferredLanguage: Language;
  technicianId?: string;
  notesEn?: string;
  notesZh?: string;
  completionPhotoUrl?: string;
  createdAt: string;
}

export type TicketStatus =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting for Parts'
  | 'Resolved'
  | 'Closed';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface InternalNote {
  id: string;
  authorNameEn: string;
  authorNameZh: string;
  authorRole: UserRole | string;
  createdAt: string;
  textEn: string;
  textZh?: string;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  customerNameEn: string;
  customerNameZh: string;
  customerMobile: string;
  addressEn: string;
  addressZh?: string;
  productModelId: string;
  serialNumber?: string;
  issueType: string;
  descriptionEn: string;
  descriptionZh?: string;
  photoUrl?: string;
  completionPhotoUrl?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTechnicianId?: string;
  branchId: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  internalNotes: InternalNote[];
  resolutionNotesEn?: string;
  resolutionNotesZh?: string;
  customerSignature?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyRecord {
  id: string;
  serialNumber: string;
  productModelId: string;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate: string;   // YYYY-MM-DD
  branchId: string;
  customerNameEn: string;
  customerNameZh: string;
  customerMobile: string;
  customerEmail?: string;
  registeredAt: string;
}

export interface InstallationChecklist {
  siteCheck: boolean;
  mounting: boolean;
  programming: boolean;
  customerDemo: boolean;
  signOff: boolean;
}

export type InstallationJobStatus = 'Scheduled' | 'In Progress' | 'Completed';

export interface InstallationJob {
  id: string;
  jobCode: string;
  saleReference: string;
  productModelId: string;
  customerNameEn: string;
  customerNameZh: string;
  customerMobile: string;
  addressEn: string;
  addressZh?: string;
  branchId: string;
  preferredDate: string; // YYYY-MM-DD
  timeSlot: string;
  assignedTechnicianId: string;
  status: InstallationJobStatus;
  checklist: InstallationChecklist;
  notesEn?: string;
  notesZh?: string;
  completionPhotoUrl?: string;
  customerSignature?: string;
  createdAt: string;
}

export interface AppDatabase {
  staffUsers: StaffUser[];
  branches: Branch[];
  technicians: Technician[];
  products: ProductModel[];
  timeSlotRules: TimeSlotRule[];
  issueTypes: IssueTypeOption[];
  bookings: Booking[];
  tickets: ServiceTicket[];
  warranties: WarrantyRecord[];
  installationJobs: InstallationJob[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'info' | 'warning' | 'error';
}
