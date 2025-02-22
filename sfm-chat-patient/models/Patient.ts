import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  telegramTopicId: { type: Number },
  lastActive: { type: Date, default: Date.now },
  sessions: [{
    startTime: Date,
    endTime: Date,
    messages: [{
      type: String,
      content: String,
      timestamp: Date,
      fileId: String,
      fileUrl: String
    }]
  }]
});

export const Patient = mongoose.model('Patient', patientSchema);