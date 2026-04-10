import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pendingListeners = []; // queue listeners registered before connect()
  }

connect() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found, cannot connect to WebSocket');
    return this;
  }
  if (this.socket?.connected) return this;
  if (this.socket && !this.socket.disconnected) return this;
const url='https://fleet-management-backend-ptpw.onrender.com'
  const rawUrl = import.meta.env.VITE_API_URL || url;
  const socketUrl = new URL(rawUrl).origin; // url— no /api path

  console.log('Connecting socket to:', socketUrl);

  this.socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'], // ✅ add polling as fallback
    reconnection: true,
    reconnectionAttempts: this.maxReconnectAttempts,
    reconnectionDelay: 1000,
  });

  this.pendingListeners.forEach(({ event, callback }) => {
    this.socket.on(event, callback);
  });
  this.pendingListeners = [];

  this.setupEventHandlers();
  return this;
}
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.subscribeToRole();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });
  }

  subscribeToRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role) {
      this.socket.emit('subscribe:role', { role: user.role });
    }
  }

  subscribeToTruck(truckId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:truck', truckId);
    }
  }

  unsubscribeFromTruck(truckId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:truck', truckId);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // Queue it — socket not created yet
      this.pendingListeners.push({ event, callback });
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    // Also remove from pending queue in case it never got attached
    this.pendingListeners = this.pendingListeners.filter(
      l => !(l.event === event && l.callback === callback)
    );
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
  if (this.socket) {
    this.socket.disconnect();
    this.socket = null;
    this.isConnected = false;
    this.pendingListeners = []; //  clear queue on disconnect
  }
}
}   

export default new WebSocketService();
