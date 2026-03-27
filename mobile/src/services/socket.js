// Socket stub — safe for web builds
const socket = {
  on:         () => {},
  off:        () => {},
  emit:       () => {},
  connect:    () => {},
  disconnect: () => {},
  connected:  false,
};

export default socket;
