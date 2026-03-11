import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingApi } from '../../api/services';

export const fetchMyBookings = createAsyncThunk('booking/fetchMine', async () => {
  const res = await bookingApi.getMyBookings();
  return res.data.data;
});

export const createBooking = createAsyncThunk('booking/create', async (data, { rejectWithValue }) => {
  try {
    const res = await bookingApi.create(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Booking failed');
  }
});

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: [],
    activeBooking: null,
    loading: false,
    error: null,
  },
  reducers: {
    setActiveBooking: (state, action) => { state.activeBooking = action.payload; },
    clearActiveBooking: (state) => { state.activeBooking = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBookings.fulfilled, (state, action) => { state.bookings = action.payload; })
      .addCase(createBooking.pending, (state) => { state.loading = true; })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.activeBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setActiveBooking, clearActiveBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
