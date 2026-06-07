import apiClient from "./apiClient";

export const getRandomRestaurants = async (limit = 6) => {
  const res = await apiClient.get(`/restaurants/random?limit=${limit}`);
  return res.data;
};

export const getRestaurantById = async (id) => {
  const res = await apiClient.get(`/restaurants/${id}`);
  return res.data;
};

export const searchRestaurants = async (name, page = 0, limit = 10) => {
  const res = await apiClient.get(`/restaurants/search?name=${name}&page=${page}&limit=${limit}`);
  return res.data;
};

export const getNearbyRestaurants = async (params) => {
  const res = await apiClient.get("/restaurants/nearby", { params });
  return res.data;
};
