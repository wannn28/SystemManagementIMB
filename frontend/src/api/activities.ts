import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/activities';

export const activitiesAPI = {
  // Get all activities
  getAllActivities: async () => {
    const response: any = await axios.get(API_URL);
    return response.data.data || [];
  },
};