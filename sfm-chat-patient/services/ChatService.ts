import { io, Socket } from 'socket.io-client';
import { TelegramService } from './TelegramService';
import { Patient } from '../models/Patient';
import { connectDB } from '../utils/db';
import Constants from 'expo-constants';

class ChatService {
  private socket: Socket;
  private messageCallbacks: Map<string, (message: any) => void>;
  private connectionCallbacks: Map<string, (status: boolean) => void>;
  private telegram: TelegramService;
  private currentPatient: any;
  private currentSession: any;

  constructor(serverUrl: string) {
    this.messageCallbacks = new Map();
    this.connectionCallbacks = new Map();
    this.telegram = new TelegramService(
      Constants.expoConfig?.extra?.telegramBotToken || '',
      Constants.expoConfig?.extra?.telegramGroupId || ''
    );
    this.initSocket(serverUrl);
  }

  async initializePatient(name: string, phoneNumber: string) {
    // Initialize MongoDB connection if not already connected
    await connectDB();

    let patient = await Patient.findOne({ phoneNumber });

    if (!patient) {
      const topicId = await this.telegram.getOrCreateTopic(name, phoneNumber);
      patient = await Patient.create({
        name,
        phoneNumber,
        telegramTopicId: topicId
      });
    }

    this.currentPatient = patient;
    this.currentSession = {
      startTime: new Date(),
      messages: []
    };

    patient.sessions.push(this.currentSession);
    await patient.save();
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

  async sendMessage(message: any): Promise<void> {
    try {
      if (!this.currentPatient || !this.currentSession) {
        // Initialize with default patient if none exists
        await this.initializePatient(
          'Default Patient', // Replace with actual patient info
          '+1234567890'     // Replace with actual phone number
        );
      }

      if (message.type === 'document') {
        const telegramFile = await this.telegram.uploadDocument({
          base64: message.uri,
          name: message.name,
          mimeType: message.mimeType
        }, this.currentPatient.telegramTopicId);

        message.uri = telegramFile.fileUrl;
        message.telegramFileId = telegramFile.fileId;
      }

      // Ensure currentSession exists
      if (!this.currentSession) {
        this.currentSession = {
          startTime: new Date(),
          messages: []
        };
        this.currentPatient.sessions.push(this.currentSession);
      }

      // Save message to current session
      this.currentSession.messages.push({
        type: message.type,
        content: message.type === 'text' ? message.text : message.uri,
        timestamp: new Date(),
        fileId: message.telegramFileId,
        fileUrl: message.uri
      });

      await this.currentPatient.save();

      // Send through socket
      this.socket.emit('message', message);
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentPatient?.save();
    }
    this.socket.disconnect();
  }

  private notifyConnectionStatus(status: boolean) {
    if (this.connectionCallbacks) {
      this.connectionCallbacks.forEach(callback => callback(status));
    }
  }

  private notifyNewMessage(message: any) {
    if (this.messageCallbacks) {
      this.messageCallbacks.forEach(callback => callback(message));
    }
  }

  onMessage(id: string, callback: (message: any) => void) {
    this.messageCallbacks.set(id, callback);
  }

  onConnectionChange(id: string, callback: (status: boolean) => void) {
    this.connectionCallbacks.set(id, callback);
  }

  private async fetchMessageHistory() {
    if (!this.currentPatient) {
      console.warn('No patient initialized, skipping message history fetch');
      return;
    }

    try {
      // Get messages from current session
      const currentSessionMessages = this.currentSession?.messages || [];

      // Convert to chat format
      const formattedMessages = currentSessionMessages.map(msg => ({
        id: String(Date.now()), // You might want to store actual message IDs
        sender: 'pasien',
        type: msg.type,
        text: msg.type === 'text' ? msg.content : undefined,
        uri: msg.type !== 'text' ? msg.fileUrl : undefined,
        name: msg.type === 'document' ? msg.content.split('/').pop() : undefined,
        timestamp: msg.timestamp
      }));

      this.notifyNewMessage(formattedMessages);
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  }
}

export { ChatService };