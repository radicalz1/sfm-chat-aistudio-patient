import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

const backendUri = 'https://96da0d26-c362-44e5-997f-ddebbd8e09b4-00-278n226e57rda.sisko.replit.dev';

export default function App() {
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const handleSendButtonPress = async () => {
    if (inputText.trim() !== '') {
      const newMessage = {
        id: String(messages.length + 1),
        sender: 'pasien',
        type: 'text',
        text: inputText.trim(),
      };

      try {
        const response = await fetch(backendUri + '/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMessage),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response dari server:', responseData);

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        console.log('Updated messages state:', updatedMessages);
        setInputText('');

        if (flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToEnd({ animated: true });
          }, 100);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const document = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
      });

      if (document.type === 'success') {
        console.log('Document URI:', document.uri);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

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
        console.log('Image URI:', selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat dengan Apoteker</Text>

      <View style={styles.chatArea}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.sender === 'apoteker' && styles.pharmacistMessageContainer,
              ]}
            >
              {item.type === 'text' && <Text style={styles.messageText}>{item.text}</Text>}
              {item.type === 'document' && (
                <View style={[styles.messageContainer, styles.documentMessageContainer]}>
                  <Feather name="file-text" size={24} color="white" style={styles.documentIcon} />
                  <Text style={[styles.messageText, styles.documentMessageText]}>{item.name}</Text>
                </View>
              )}
              {item.type === 'image' && (
                <View style={styles.imageMessageContainerSimplified}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.imageMessageImageSimplified}
                    resizeMode="contain"
                  />
                </View>
              )}
              {item.type === 'default' && (
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>Jenis pesan tidak dikenal</Text>
                  </View>
              )}
            </View>
          )}
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
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
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
});