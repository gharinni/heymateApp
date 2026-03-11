import { createSlice } from '@reduxjs/toolkit';

const locationSlice = createSlice({
  name: 'location',
  initialState: {
    userLocation: null,    // { lat, lng }
    providerLocation: null, // live tracking
    sheSafeActive: false,
    error: null,
  },
  reducers: {
    setUserLocation: (state, action) => { state.userLocation = action.payload; },
    setProviderLocation: (state, action) => { state.providerLocation = action.payload; },
    setSheSafeActive: (state, action) => { state.sheSafeActive = action.payload; },
    setLocationError: (state, action) => { state.error = action.payload; },
  },
});

export const { setUserLocation, setProviderLocation, setSheSafeActive, setLocationError } = locationSlice.actions;
export default locationSlice.reducer;
