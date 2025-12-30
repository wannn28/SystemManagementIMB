import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/activities';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;  // Backend returns snake_case
  has_next: boolean;     // Backend returns snake_case
  has_prev: boolean;     // Backend returns snake_case
}

// Mapped interface for frontend use
export interface FrontendPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ActivitiesResponse {
  data: any[];
  pagination: FrontendPagination;
}

export const activitiesAPI = {
  // Get recent activities (default 10)
  getAllActivities: async () => {
    const response: any = await axios.get(API_URL);
    return response.data.data || [];
  },

  // Get all activities with pagination
  getAllActivitiesWithPagination: async (params?: PaginationParams): Promise<ActivitiesResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);

    const response: any = await axios.get(`${API_URL}/paginated?${queryParams.toString()}`);
    
    // Map snake_case from backend to camelCase for frontend
    const backendPagination: PaginationResponse = response.data.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false
    };

    return {
      data: response.data.data || [],
      pagination: {
        page: backendPagination.page,
        limit: backendPagination.limit,
        total: backendPagination.total,
        totalPages: backendPagination.total_pages,
        hasNext: backendPagination.has_next,
        hasPrev: backendPagination.has_prev
      }
    };
  },
};