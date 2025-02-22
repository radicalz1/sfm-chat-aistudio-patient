import axios from 'axios';

export class TelegramService {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async getOrCreateTopic(patientName: string, phoneNumber: string): Promise<number> {
    try {
      // Search for existing topic
      const response = await axios.get(
        `${this.baseUrl}/getForumTopics?chat_id=${this.chatId}`
      );

      const topics = response.data.result.topics;
      const existingTopic = topics.find(t => t.name.includes(phoneNumber));

      if (existingTopic) {
        return existingTopic.message_thread_id;
      }

      // Create new topic if none exists
      const newTopic = await axios.post(`${this.baseUrl}/createForumTopic`, {
        chat_id: this.chatId,
        name: `${patientName} (${phoneNumber})`,
        icon_color: 9367192 // Light blue color
      });

      return newTopic.data.result.message_thread_id;
    } catch (error) {
      console.error('Error managing topic:', error);
      throw error;
    }
  }

  async uploadDocument(file: {
    base64: string;
    name: string;
    mimeType: string;
  }, messageThreadId: number) {
    try {
      // Convert base64 to Blob
      const binaryData = Buffer.from(file.base64.split(',')[1], 'base64');
      const formData = new FormData();
      const blob = new Blob([binaryData], { type: file.mimeType });

      formData.append('document', blob, file.name);
      formData.append('chat_id', this.chatId);

      if (messageThreadId) {
        formData.append('message_thread_id', String(messageThreadId));
      }

      const response = await axios.post(`${this.baseUrl}/sendDocument`, formData);

      if (response.data.ok) {
        const fileId = response.data.result.document.file_id;
        const fileUrl = await this.getFileUrl(fileId);
        return {
          fileId,
          fileUrl,
          name: file.name
        };
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Telegram upload error:', error);
      throw error;
    }
  }

  private async getFileUrl(fileId: string): Promise<string> {
    const response = await axios.get(`${this.baseUrl}/getFile?file_id=${fileId}`);
    if (response.data.ok) {
      const filePath = response.data.result.file_path;
      return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    }
    throw new Error('Failed to get file URL');
  }
}