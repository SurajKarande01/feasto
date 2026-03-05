 
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: false, token: null, role: null },
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