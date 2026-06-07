import { createSlice } from '@reduxjs/toolkit';

// ---------------------------------------------------------------------------
// Hydrate initial state from localStorage so a page refresh doesn't
// reset the auth state to "not logged in" when a valid token exists.
// ---------------------------------------------------------------------------
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { isAuthenticated: false, token: null, role: null };

    let role = null;
    if (localStorage.getItem('restaurantProfile')) role = 'RESTAURANT_OWNER';
    else if (localStorage.getItem('deliveryProfile')) role = 'DELIVERY_PARTNER';
    else if (localStorage.getItem('customerProfile')) role = 'CUSTOMER';

    return { isAuthenticated: true, token, role };
  } catch {
    return { isAuthenticated: false, token: null, role: null };
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    setRole(state, action) {
      state.role = action.payload;
    },
    login(state, action) {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.role = action.payload.role;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.token = null;
      state.role = null;
    },
  },
});

export const { setRole, login, logout } = authSlice.actions;
export default authSlice.reducer;