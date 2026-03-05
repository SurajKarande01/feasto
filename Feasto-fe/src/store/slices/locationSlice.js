import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	coords: null,
};

const locationSlice = createSlice({
	name: 'location',
	initialState,
	reducers: {
		setCoords(state, action) {
			state.coords = action.payload;
		},
		clearCoords(state) {
			state.coords = null;
		},
	},
});

export const { setCoords, clearCoords } = locationSlice.actions;
export default locationSlice.reducer;
 
