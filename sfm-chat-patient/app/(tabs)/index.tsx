import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Button, 
  FlatList, 
  Image, 
  ActivityIndicator,
  TouchableOpacity,
  Linking
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { ChatService } from '../../services/ChatService';
import * as FileSystem from 'expo-file-system';

const backendUri = 'https://96da0d26-c362-44e5-997f-ddebbd8e09b4-00-278n226e57rda.sisko.replit.dev:3000';

export default function App() {
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const chatService = useRef<ChatService | null>(null);

  useEffect(() => {
    chatService.current = new ChatService(backendUri);

    chatService.current.onConnectionChange('main', (status) => {
      setIsConnected(status);
    });

    chatService.current.onMessage('main', (message) => {
      if (Array.isArray(message)) {
        setMessages(message);
      } else {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      chatService.current?.disconnect();
    };
  }, []);

  const handleSendButtonPress = async () => {
    if (inputText.trim() !== '') {
      const newMessage = {
        id: String(Date.now()),
        sender: 'pasien',
        type: 'text',
        text: inputText.trim(),
        timestamp: new Date().toISOString(),
      };

      chatService.current?.sendMessage(newMessage);
      setInputText('');
      setMessages(prev => [...prev, newMessage]);

      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  };

  // Add loading state
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});

  // Modify document upload handler
  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const messageId = String(Date.now());
        setUploadingFiles(prev => ({ ...prev, [messageId]: true }));

        try {
          const file = result.assets[0];
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const newMessage = {
            id: messageId,
            sender: 'pasien',
            type: 'document',
            name: file.name,
            uri: `data:${file.mimeType};base64,${base64}`,
            mimeType: file.mimeType,
            timestamp: new Date().toISOString(),
          };

          setMessages(prev => [...prev, {
            ...newMessage,
            uploading: true
          }]);

          await chatService.current?.sendMessage(newMessage);

          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, uploading: false } 
              : msg
          ));
        } finally {
          setUploadingFiles(prev => {
            const newState = { ...prev };
            delete newState[messageId];
            return newState;
          });
        }
      }
    } catch (error) {
      console.error('Error in document upload:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  // Remove this entire block (lines 131-157)
  /* Remove from here
  {item.type === 'document' && (
    <TouchableOpacity>
      onPress={() => {
        if (!item.uploading && item.uri) {
          Linking.openURL(item.uri);
        }
      }}
    >
      <View style={[styles.messageContainer, styles.documentMessageContainer]}>
        <Feather name="file-text" size={24} color="white" style={styles.documentIcon} />
        <View style={styles.documentContent}>
          <Text style={[styles.messageText, styles.documentMessageText]}>
            {item.name}
          </Text>
          {item.uploading && (
            <ActivityIndicator size="small" color="#fff" style={styles.uploadingIndicator} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  )}
  Remove to here */

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert('Izin akses galeri foto dibutuhkan!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const selectedImage = pickerResult.assets[0];
        const newMessage = {
          id: String(Date.now()),
          sender: 'pasien',
          type: 'image',
          uri: selectedImage.uri,
          timestamp: new Date().toISOString(),
        };

        chatService.current?.sendMessage(newMessage);
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'text') {
      return (
        <View style={[
          styles.messageContainer,
          item.sender === 'apoteker' && styles.pharmacistMessageContainer,
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      );
    }

    if (item.type === 'document') {
      return (
        <TouchableOpacity 
          onPress={() => {
            if (!item.uploading && item.uri) {
              Linking.openURL(item.uri);
            }
          }}
        >
          <View style={[
            styles.messageContainer,
            styles.documentMessageContainer,
            item.sender === 'apoteker' && styles.pharmacistMessageContainer,
          ]}>
            <Feather name="file-text" size={24} color="white" style={styles.documentIcon} />
            <View style={styles.documentContent}>
              <Text style={[styles.messageText, styles.documentMessageText]}>
                {item.name}
              </Text>
              {item.uploading && (
                <ActivityIndicator size="small" color="#fff" style={styles.uploadingIndicator} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === 'image') {
      return (
        <View style={[
          styles.messageContainer,
          item.sender === 'apoteker' && styles.pharmacistMessageContainer,
        ]}>
          <View style={styles.imageMessageContainerSimplified}>
            <Image
              source={{ uri: item.uri }}
              style={styles.imageMessageImageSimplified}
              resizeMode="contain"
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        item.sender === 'apoteker' && styles.pharmacistMessageContainer,
      ]}>
        <Text style={styles.messageText}>Jenis pesan tidak dikenal</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat dengan Apoteker</Text>
        {!isConnected && (
          <View style={styles.connectionStatus}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.connectionText}>Reconnecting...</Text>
          </View>
        )}
      </View>

      <View style={styles.chatArea}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          renderItem={renderItem}
          onContentSizeChange={() => {
            if (flatListRef.current && messages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
        />
      </View>

      <View style={styles.inputArea}>
        <Button title="Dokumen" onPress={handleDocumentUpload} />
        <Button title="Gambar" onPress={handleImageUpload} />
        <TextInput
          style={styles.input}
          placeholder="Ketik pesan..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendButtonPress}
          multiline={true}
        />
        <Button title="Kirim" onPress={handleSendButtonPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'stretch',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  connectionText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 12,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    color: 'black',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  messageContainer: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  pharmacistMessageContainer: {
    backgroundColor: '#005792',
    alignSelf: 'flex-end',
  },
  documentMessageContainer: {
    backgroundColor: '#607D8B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentMessageText: {
    marginLeft: 10,
    flex: 1,
  },
  documentIcon: {
    marginLeft: 5,
  },
  imageMessageContainerSimplified: {
    backgroundColor: 'transparent',
    width: 150,
    height: 150,
  },
  imageMessageImageSimplified: {
    width: 150,
    height: 150,
  },
  flatList: {
    pointerEvents: 'auto'
  },
  documentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadingIndicator: {
    marginLeft: 10,
  },
});