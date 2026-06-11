import apiClient from "./apiClient";

export const loginUser = async (data) => {
  const res = await apiClient.post("/users/login", data);
  if (res.data.token) {
    localStorage.clear();
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("customerProfile", JSON.stringify(res.data.profile));
  }
  return res.data;
};

export const registerUser = (data) => {
  return apiClient.post("/users/register", data);
};

export const loginRestaurant = async (data) => {
  const res = await apiClient.post("/restaurants/login", data);
  if (res.data.token) {
    localStorage.clear();
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("restaurantProfile", JSON.stringify(res.data.profile));
  }
  return res.data;
};

export const registerRestaurant = (data) => {
  // Do NOT set Content-Type manually — axios auto-sets it with the correct multipart boundary
  return apiClient.post("/restaurants/register", data);
};

export const loginDeliveryPartner = async (data) => {
  const res = await apiClient.post("/delivery-partners/login", data);
  if (res.data.token) {
    localStorage.clear();
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("deliveryProfile", JSON.stringify(res.data.profile));
  }
  return res.data;
};

export const registerDeliveryPartner = (data) => {
  return apiClient.post("/delivery-partners/register", data);
};

export const logout = () => {
  localStorage.clear();
  window.location.href = "/welcome";
};