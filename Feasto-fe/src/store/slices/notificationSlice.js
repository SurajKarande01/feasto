import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	notifications: [],
};

const notificationSlice = createSlice({
	name: 'notification',
	initialState,
	reducers: {
		pushNotification(state, action) {
			state.notifications.push(action.payload);
		},
		clearNotifications(state) {
			state.notifications = [];
		},
	},
});

export const { pushNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;

 
