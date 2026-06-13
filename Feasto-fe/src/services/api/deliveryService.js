import apiClient from "./apiClient";

/**
 * Fetch delivery partner profile by ID.
 * GET /api/delivery-partners/{id}
 */
export const getDeliveryPartnerById = async (id) => {
  const res = await apiClient.get(`/delivery-partners/${id}`);
  return res.data;
};

/**
 * Update delivery partner availability and location.
 * PUT /api/delivery-partners/{id}/availability
 */
export const updateAvailability = async (id, payload) => {
  const res = await apiClient.put(`/delivery-partners/${id}/availability`, payload);
  return res.data;
};

/**
 * Fetch orders assigned to a delivery partner.
 * GET /api/delivery-partners/{id}/orders
 */
export const getOrdersByDeliveryPartnerId = async (id) => {
  const res = await apiClient.get(`/delivery-partners/${id}/orders`);
  return res.data;
};

/**
 * Get earnings info (placeholder endpoint).
 * GET /api/delivery-partners/{id}/earnings
 */
export const getEarnings = async (id) => {
  const res = await apiClient.get(`/delivery-partners/${id}/earnings`);
  return res.data;
};

/**
 * Update order status (e.g., OUT_FOR_DELIVERY, DELIVERED).
 * PUT /api/orders/{orderId}/status?orderStatus={status}
 */
export const updateOrderStatus = async (orderId, status) => {
  const res = await apiClient.put(`/orders/${orderId}/status`, null, {
    params: { orderStatus: status },
  });
  return res.data;
};

/**
 * Publish live location for WebSocket broadcast.
 * POST /api/delivery-partners/location
 */
export const publishLocation = async (payload) => {
  const res = await apiClient.post("/delivery-partners/location", payload);
  return res.data;
};

/**
 * Get notifications for delivery partner.
 * GET /api/notifications/DELIVERY_PARTNER/{id}
 */
export const getDeliveryNotifications = async (partnerId) => {
  const res = await apiClient.get(`/notifications/DELIVERY_PARTNER/${partnerId}`);
  return res.data;
};

/**
 * Get unread notification count for delivery partner.
 * GET /api/notifications/DELIVERY_PARTNER/{id}/unread-count
 */
export const getDeliveryUnreadCount = async (partnerId) => {
  const res = await apiClient.get(`/notifications/DELIVERY_PARTNER/${partnerId}/unread-count`);
  return res.data;
};

/**
 * Mark all notifications read for delivery partner.
 * POST /api/notifications/DELIVERY_PARTNER/{id}/mark-all-read
 */
export const markAllDeliveryNotificationsRead = async (partnerId) => {
  const res = await apiClient.post(`/notifications/DELIVERY_PARTNER/${partnerId}/mark-all-read`);
  return res.data;
};

/**
 * Get reviews for a delivery partner.
 * GET /api/reviews/delivery-partner/{id}
 */
export const getDeliveryPartnerReviews = async (partnerId) => {
  const res = await apiClient.get(`/reviews/delivery-partner/${partnerId}`);
  return res.data;
};
