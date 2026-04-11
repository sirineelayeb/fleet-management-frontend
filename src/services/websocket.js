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
  if (!token) return;

  if (this.socket?.connected) return;

  const socketUrl =
    import.meta.env.VITE_WS_URL ||
    "https://fleet-management-backend-ptpw.onrender.com";

  console.log('Connecting socket to:', socketUrl);

  this.socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  this.pendingListeners.forEach(({ event, callback }) => {
    this.socket.on(event, callback);
  });
  this.pendingListeners = [];

  this.setupEventHandlers();
}
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
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
