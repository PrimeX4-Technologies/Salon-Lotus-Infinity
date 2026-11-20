import { apiClient } from "./client";
import type {
  ApiSuccess,
  Availability,
  Branch,
  BusinessOverview,
  CatalogCategory,
  Paginated,
  Product,
  Service,
  ServicePackage,
} from "./types";

export interface CatalogQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  branchId?: string;
}

const compactParams = (input: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== ""));

export const publicApi = {
  async business(): Promise<BusinessOverview> {
    const response = await apiClient.get<ApiSuccess<BusinessOverview>>("/public/business");
    return response.data.data;
  },

  async branches(): Promise<Branch[]> {
    const response = await apiClient.get<Paginated<Branch>>("/public/branches", {
      params: { page: 1, limit: 100 },
    });
    return response.data.data;
  },

  async categories(): Promise<CatalogCategory[]> {
    const response = await apiClient.get<Paginated<CatalogCategory>>("/public/catalog/categories", {
      params: { page: 1, limit: 100 },
    });
    return response.data.data;
  },

  async services(query: CatalogQuery = {}): Promise<Paginated<Service>> {
    const response = await apiClient.get<Paginated<Service>>("/public/catalog/services", {
      params: compactParams({ page: 1, limit: 12, ...query }),
    });
    return response.data;
  },

  async products(query: CatalogQuery = {}): Promise<Paginated<Product>> {
    const response = await apiClient.get<Paginated<Product>>("/public/catalog/products", {
      params: compactParams({ page: 1, limit: 12, ...query }),
    });
    return response.data;
  },

  async packages(query: CatalogQuery = {}): Promise<Paginated<ServicePackage>> {
    const response = await apiClient.get<Paginated<ServicePackage>>("/public/catalog/packages", {
      params: compactParams({ page: 1, limit: 12, ...query }),
    });
    return response.data;
  },

  async availability(input: {
    branchId: string;
    serviceId: string;
    date: string;
    customerGender?: "male" | "female" | "other" | "unspecified";
  }): Promise<Availability> {
    const response = await apiClient.get<ApiSuccess<Availability>>("/public/availability", {
      params: compactParams(input),
    });
    return response.data.data;
  },
};
