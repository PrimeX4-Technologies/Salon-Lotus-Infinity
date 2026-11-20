export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { pagination?: PaginationMeta; idempotentReplay?: boolean };
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> extends ApiSuccess<T[]> {
  meta: { pagination: PaginationMeta };
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface PricePresentation {
  mode: "fixed" | "starting_from" | "range" | "quote_required";
  currency: string;
  amountMinor?: number;
  fromAmountMinor?: number;
  toAmountMinor?: number;
  label?: string;
}

export interface ServiceDuration {
  applicationMinutes: number;
  processingMinutes: number;
  finishingMinutes: number;
  bufferMinutes: number;
  processingBlocksEmployee: boolean;
}

export interface AdvancePolicy {
  requirement: "none" | "optional" | "required";
  calculation: "none" | "fixed" | "percentage";
  fixedAmountMinor?: number;
  percentage?: number;
  basis: "estimate" | "accepted_quote";
}

export interface Branch {
  _id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: Address;
  isPrimary: boolean;
  isActive: boolean;
  bookingsEnabled: boolean;
}

export interface BusinessProfile {
  _id: string;
  name: string;
  legalName?: string;
  slug: string;
  status: "active" | "inactive" | "closed";
  email?: string;
  phone?: string;
  websiteUrl?: string;
  logoUrl?: string;
  registeredAddress?: Address;
}

export interface BusinessSettings {
  branchMode: "single" | "multiple";
  primaryBranchId: string;
  locale: string;
  currency: string;
  finalPaymentHandling: "at_salon" | "external_system";
  booking?: {
    maximumAdvanceDays?: number;
    minimumNoticeMinutes?: number;
    allowWaitlist?: boolean;
  };
  customerAuth?: {
    emailPasswordEnabled?: boolean;
    phonePasswordEnabled?: boolean;
    googleEnabled?: boolean;
  };
}

export interface BusinessOverview {
  profile: BusinessProfile;
  settings?: BusinessSettings | null;
  branches: Branch[];
}

export interface CatalogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  appliesTo: Array<"service" | "product" | "package">;
  sortOrder: number;
  isActive: boolean;
}

export interface BranchService {
  _id: string;
  branchId: string;
  serviceId: string;
  priceOverride?: PricePresentation | null;
  durationOverride?: ServiceDuration | null;
  advancePolicyOverride?: AdvancePolicy | null;
  isActive: boolean;
  isOnlineBookable: boolean;
}

export interface Service {
  _id: string;
  categoryId: string;
  code: string;
  name: string;
  slug: string;
  description?: string;
  targetClientGender: "male" | "female" | "all";
  duration: ServiceDuration;
  price: PricePresentation;
  advancePolicy?: AdvancePolicy | null;
  bookingMode: "instant" | "request" | "consultation_required";
  isActive: boolean;
  isOnlineBookable: boolean;
  branchService?: BranchService | null;
}

export interface Product {
  _id: string;
  categoryId: string;
  branchIds: string[];
  availableAtAllBranches: boolean;
  code: string;
  name: string;
  slug: string;
  brand?: string;
  description?: string;
  imageUrls: string[];
  price: PricePresentation;
  purchaseMode: "in_store" | "external_link" | "inquiry";
  externalPurchaseUrl?: string;
  isPublished: boolean;
}

export interface ServicePackage {
  _id: string;
  categoryId: string;
  branchIds: string[];
  availableAtAllBranches: boolean;
  code: string;
  name: string;
  slug: string;
  description?: string;
  kind: "bundle" | "wedding" | "event";
  bookingMode: "request_quote" | "consultation_required";
  minimumPartySize: number;
  maximumPartySize?: number | null;
  allowsOffsite: boolean;
  price: PricePresentation;
  advancePolicy?: AdvancePolicy | null;
  isPublished: boolean;
}

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
  duration: ServiceDuration;
  price: PricePresentation;
}

export interface Availability {
  branchId: string;
  service: { id: string; name: string; bookingMode: "instant" | "request" };
  date: string;
  timeZone: string;
  generatedAt: string;
  employees: Array<{
    employee: { id: string; name: string; title?: string; avatarUrl?: string };
    slots: AvailabilitySlot[];
  }>;
  totalSlots: number;
}

export interface PublicUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: "customer" | "employee" | "admin";
  avatarUrl?: string;
  isActive: boolean;
}

export interface AuthResult {
  user: PublicUser;
  authentication: {
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number;
    refreshExpiresIn: number;
    csrfToken: string;
  };
}

export interface Customer {
  _id: string;
  userId?: string | null;
  name: string;
  preferredName?: string | null;
  email?: string | null;
  phone?: string | null;
  gender: "male" | "female" | "non_binary" | "prefer_not_to_say" | "unspecified";
  dateOfBirth?: string | null;
  preferredBranchId?: string | null;
  preferredEmployeeId?: string | null;
  status: "active" | "blocked" | "archived";
}

export type BookingStatus =
  | "requested"
  | "pending_advance"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface BookingItem {
  _id: string;
  serviceId: string;
  employeeId: string;
  serviceSnapshot: { name?: string; code?: string } & Record<string, unknown>;
  employeeSnapshot: { name?: string; title?: string } & Record<string, unknown>;
  startAt: string;
  endAt: string;
  status: BookingStatus;
}

export interface Booking {
  _id: string;
  branchId: string;
  reference: string;
  source: string;
  status: BookingStatus;
  startAt: string;
  endAt: string;
  pricingSnapshot: {
    currency?: string;
    estimatedTotalMinor?: number;
    advanceDueMinor?: number;
    advancePaidMinor?: number;
    advanceRequirement?: string;
  } & Record<string, unknown>;
  customerNote?: string;
  cancellationReason?: string;
  items: BookingItem[];
  holdExpired: boolean;
  createdAt: string;
}

export interface BookingInquiry {
  _id: string;
  branchId?: string;
  packageId?: string;
  serviceIds: string[];
  productIds: string[];
  type: "service" | "product" | "package" | "wedding" | "event";
  preferredDateFrom?: string;
  preferredDateTo?: string;
  partySize: number;
  offsite: boolean;
  venueAddress?: string;
  customerNote?: string;
  status: "new" | "reviewing" | "quoted" | "accepted" | "declined" | "expired" | "cancelled";
  createdAt: string;
}

export interface BookingCreateInput {
  branchId: string;
  items: Array<{ serviceId: string; employeeId: string; startAt: string }>;
  customerAcceptedVariablePricing?: true;
  customerNote?: string | null;
}

export interface InquiryCreateInput {
  branchId?: string;
  packageId?: string;
  serviceIds?: string[];
  productIds?: string[];
  type: BookingInquiry["type"];
  preferredDateFrom?: string;
  preferredDateTo?: string;
  partySize?: number;
  offsite?: boolean;
  venueAddress?: string | null;
  customerNote?: string | null;
}
