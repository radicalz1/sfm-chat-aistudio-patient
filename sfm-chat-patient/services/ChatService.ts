import { io, Socket } from 'socket.io-client';

class ChatService {
  private socket: Socket;
  private messageCallbacks: Map<string, (message: any) => void>;
  private connectionCallbacks: Map<string, (status: boolean) => void>;

  constructor(serverUrl: string) {
    this.messageCallbacks = new Map();
    this.connectionCallbacks = new Map();
    this.initSocket(serverUrl);
  }

  private initSocket(serverUrl: string) {
    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.notifyConnectionStatus(true);
      this.fetchMessageHistory();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.notifyConnectionStatus(false);
    });

    this.socket.on('reconnecting', (attemptNumber) => {
      console.log('Attempting to reconnect...', attemptNumber);
    });

    this.socket.on('message', (message) => {
      console.log('Received message:', message);
      this.notifyNewMessage(message);
    });

    this.socket.on('history', (messages) => {
      console.log('Received message history');
      this.notifyNewMessage(messages);
    });

    this.socket.on('message:ack', (ack) => {
      console.log('Message acknowledged:', ack);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  sendMessage(message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket.connected) {
        console.warn('Not connected to server, message will be queued');
        reject(new Error('Not connected to server'));
        return;
      }

      // Add detailed logging for document messages
      if (message.type === 'document') {
        console.log('Sending document:', {
          type: message.type,
          id: message.id,
          name: message.name,
          mimeType: message.mimeType,
          uriPrefix: message.uri?.substring(0, 50) + '...',
          uriLength: message.uri?.length
        });
      }

      this.socket.emit('message', message, (response: any) => {
        console.log('Server response:', response);
        if (response?.error) {
          console.error('Message send failed:', response.error);
          reject(response.error);
        } else {
          console.log('Message sent successfully');
          resolve();
        }
      });
    });
  }

  private fetchMessageHistory() {
    console.log('Fetching message history...');
    this.socket.emit('fetch:history');
  }

  onMessage(id: string, callback: (message: any) => void) {
    this.messageCallbacks.set(id, callback);
  }

  onConnectionChange(id: string, callback: (status: boolean) => void) {
    this.connectionCallbacks.set(id, callback);
  }

  private notifyNewMessage(message: any) {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  private notifyConnectionStatus(status: boolean) {
    this.connectionCallbacks.forEach(callback => callback(status));
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export { ChatService };