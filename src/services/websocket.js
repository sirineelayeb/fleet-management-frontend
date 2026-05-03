import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pendingListeners = [];
    this.userId = null;
    this.userRole = null;
    this.joinRetryTimeout = null;
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping WebSocket connection');
      return;
    }

    if (this.isConnecting) {
      console.log('Connection already in progress, skipping...');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected, skipping...');
      return;
    }

    // Get user info from localStorage
    this.loadUserInfo();

    const socketUrl = import.meta.env.VITE_WS_URL || "http://localhost:5000";

    console.log('🔄 Connecting socket to:', socketUrl);
    console.log('User ID:', this.userId);
    console.log('User Role:', this.userRole);

    this.isConnecting = true;
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();

    // Add pending listeners
    this.pendingListeners.forEach(({ event, callback }) => {
      this.socket.on(event, callback);
    });
    this.pendingListeners = [];
  }

  loadUserInfo() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.userId = user._id || user.id;
      this.userRole = user.role;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }

  retryJoinRooms() {
  if (this.joinRetryTimeout) {
    clearTimeout(this.joinRetryTimeout);
  }
  
  this.joinRetryTimeout = setTimeout(() => {
    this.loadUserInfo();
    
    if (this.userId && this.userRole && this.socket?.connected) {
      console.log('🔄 Retrying room join for user:', this.userId);
      this.socket.emit('join', { userId: this.userId, role: this.userRole });
      
      // ✅ Join the correct role room
      const roomToJoin = this.userRole === 'admin' ? 'admin' : 'shipment_manager';
      this.socket.emit('joinRoom', roomToJoin);
      
    } else if (!this.userId || !this.userRole) {
      console.log('⚠️ Missing userId or userRole, will retry again');
      this.retryJoinRooms();
    }
  }, 500);
}

  setupEventHandlers() {
  this.socket.on('connect', () => {
    console.log('✅ WebSocket connected successfully');
    console.log('Socket ID:', this.socket.id);
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Load fresh user info
    this.loadUserInfo();
    
    // Join user and role rooms AFTER connection
    if (this.userId && this.userRole) {
      console.log('📡 Joining rooms for user:', this.userId, 'role:', this.userRole);
      
      // Join user-specific room
      this.socket.emit('join', { userId: this.userId, role: this.userRole });
      
      // ✅ CRITICAL: Join the role-specific room that backend expects
      // For admin role, join 'admin' room
      // For shipment_manager role, join 'shipment_manager' room
      const roomToJoin = this.userRole === 'admin' ? 'admin' : 'shipment_manager';
      console.log(`📡 Joining room: ${roomToJoin}`);
      this.socket.emit('joinRoom', roomToJoin);
      
    } else {
      console.warn('⚠️ No userId or userRole available, will retry...');
      this.retryJoinRooms();
    }
  });

  this.socket.on('connection_confirmed', (data) => {
    console.log('📡 Connection confirmed:', data);
    console.log('✅ Socket is in rooms:', data.rooms);
  });

  this.socket.on('joined_rooms', (data) => {
    console.log('✅ Successfully joined rooms:', data.rooms);
  });

  // Add this to debug room joins
  this.socket.on('room_joined', (room) => {
    console.log(`✅ Confirmed joined room: ${room}`);
  });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      this.isConnected = false;
      this.isConnecting = false;
    });
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      this.pendingListeners.push({ event, callback });
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    this.pendingListeners = this.pendingListeners.filter(
      l => !(l.event === event && l.callback === callback)
    );
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}, socket not connected`);
    }
  }

  disconnect() {
    if (this.joinRetryTimeout) {
      clearTimeout(this.joinRetryTimeout);
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.pendingListeners = [];
    }
  }
}

// ✅ Create and export a single instance
const webSocketService = new WebSocketService();
export default webSocketService;