import api from './index';

export const paymentAPI = {
  initiate: (bookingId) =>
    api.post('/api/payments/initiate', { bookingId }),

  verify: (razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
    api.post('/api/payments/verify', {
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
    }),
};
