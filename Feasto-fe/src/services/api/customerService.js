import apiClient from "./apiClient";

/**
 * Fetch all orders for a specific user (customer).
 * GET /api/orders/user/{userId}
 */
export const getOrdersByUserId = async (userId) => {
  const res = await apiClient.get(`/orders/user/${userId}`);
  return res.data;
};

/**
 * Fetch a single order by ID.
 * GET /api/orders/{orderId}
 */
export const getOrderById = async (orderId) => {
  const res = await apiClient.get(`/orders/${orderId}`);
  return res.data;
};

/**
 * Cancel an order (customer-side).
 * PUT /api/orders/{orderId}/status?orderStatus=CANCELLED
 */
export const cancelOrder = async (orderId) => {
  const res = await apiClient.put(`/orders/${orderId}/status`, null, {
    params: { orderStatus: "CANCELLED" },
  });
  return res.data;
};

/**
 * Fetch loyalty program info for a user.
 * GET /api/loyalty/user/{userId}
 */
export const getLoyaltyByUserId = async (userId) => {
  const res = await apiClient.get(`/loyalty/user/${userId}`);
  return res.data;
};

/**
 * Subscribe to loyalty program.
 * POST /api/loyalty/subscribe
 */
export const subscribeLoyalty = async (payload) => {
  const res = await apiClient.post("/loyalty/subscribe", payload);
  return res.data;
};

/**
 * Fetch user profile by ID.
 * GET /api/users/{id}
 */
export const getUserById = async (userId) => {
  const res = await apiClient.get(`/users/${userId}`);
  return res.data;
};

/**
 * Submit a review.
 * POST /api/reviews
 */
export const submitReview = async (payload) => {
  const res = await apiClient.post("/reviews", payload);
  return res.data;
};

/**
 * Get reviews for a restaurant.
 * GET /api/reviews/restaurant/{restaurantId}
 */
export const getReviewsByRestaurantId = async (restaurantId) => {
  const res = await apiClient.get(`/reviews/restaurant/${restaurantId}`);
  return res.data;
};

/**
 * Process a payment.
 * POST /api/payments
 */
export const processPayment = async (payload) => {
  const res = await apiClient.post("/payments", payload);
  return res.data;
};

/**
 * Get notifications for customer.
 * GET /api/notifications/CUSTOMER/{id}
 */
export const getCustomerNotifications = async (customerId) => {
  const res = await apiClient.get(`/notifications/CUSTOMER/${customerId}`);
  return res.data;
};

/**
 * Get unread notification count.
 * GET /api/notifications/CUSTOMER/{id}/unread-count
 */
export const getCustomerUnreadCount = async (customerId) => {
  const res = await apiClient.get(`/notifications/CUSTOMER/${customerId}/unread-count`);
  return res.data;
};

/**
 * Mark all notifications read for customer.
 * POST /api/notifications/CUSTOMER/{id}/mark-all-read
 */
export const markAllCustomerNotificationsRead = async (customerId) => {
  const res = await apiClient.post(`/notifications/CUSTOMER/${customerId}/mark-all-read`);
  return res.data;
};
