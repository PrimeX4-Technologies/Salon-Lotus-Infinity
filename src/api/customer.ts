import { apiClient } from "./client";
import type {
  ApiSuccess,
  Booking,
  BookingCreateInput,
  BookingInquiry,
  Customer,
  InquiryCreateInput,
  Paginated,
} from "./types";

export const customerApi = {
  async profile(): Promise<Customer> {
    const response = await apiClient.get<ApiSuccess<Customer>>("/customers/me");
    return response.data.data;
  },

  async updateProfile(input: Partial<Pick<Customer, "name" | "preferredName" | "gender" | "dateOfBirth" | "preferredBranchId" | "preferredEmployeeId">>): Promise<Customer> {
    const response = await apiClient.patch<ApiSuccess<Customer>>("/customers/me", input);
    return response.data.data;
  },

  async bookings(page = 1): Promise<Paginated<Booking>> {
    const response = await apiClient.get<Paginated<Booking>>("/customer/bookings", {
      params: { page, limit: 10, includeItems: "true", sort: "-createdAt" },
    });
    return response.data;
  },

  async createBooking(input: BookingCreateInput, idempotencyKey: string): Promise<Booking> {
    const response = await apiClient.post<ApiSuccess<Booking>>("/customer/bookings", input, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
    return response.data.data;
  },

  async cancelBooking(bookingId: string, reason: string): Promise<void> {
    await apiClient.post(`/customer/bookings/${bookingId}/cancel`, { reason });
  },

  async inquiries(page = 1): Promise<Paginated<BookingInquiry>> {
    const response = await apiClient.get<Paginated<BookingInquiry>>("/customer/inquiries", {
      params: { page, limit: 10, sort: "-createdAt" },
    });
    return response.data;
  },

  async createInquiry(input: InquiryCreateInput): Promise<BookingInquiry> {
    const response = await apiClient.post<ApiSuccess<BookingInquiry>>("/customer/inquiries", input);
    return response.data.data;
  },

  async cancelInquiry(inquiryId: string): Promise<void> {
    await apiClient.post(`/customer/inquiries/${inquiryId}/cancel`);
  },
};
