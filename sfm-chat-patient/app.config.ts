import 'dotenv/config';

export default {
  name: "sfm-chat-patient",
  version: "1.0.0",
  extra: {
    mongodbUri: process.env.MONGODB_URI,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramGroupId: process.env.TELEGRAM_GROUP_ID,
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          enableProguardInReleaseBuilds: true,
        },
      },
    ],
  ],
};