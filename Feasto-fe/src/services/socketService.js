// socketService.js — stub for future WebSocket / STOMP integration
// Replace with real connection logic when ready.

export const connect = () => {};
export const disconnect = () => {};
export const subscribe = (_topic, _callback) => ({ unsubscribe: () => {} });
export const publish = (_destination, _body) => {};
