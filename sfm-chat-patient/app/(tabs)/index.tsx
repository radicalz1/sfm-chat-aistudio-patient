import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, Image, requestAnimationFrame } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';

const backendUri = 'https://864412fa-f453-4841-8473-1b97e7555524-00-1uikfcb9cs0wd.pike.replit.dev';

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

        console.log('Response ok:', response.ok);
        console.log('Response status:', response.status);

        const responseData = await response.json();
        console.log('Response dari server:', responseData);

        setMessages([...messages, newMessage]);
        console.log('Updated messages state:', messages);

        setInputText('');
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        });
      } catch (error) {
        console.error('Gagal mengirim pesan ke server:', error);
        console.error('Full error object:', error);
        alert('Gagal mengirim pesan. Coba lagi nanti.');
      }
    }
  };

  const handleDocumentUpload = async () => {
    console.log('handleDocumentUpload dipanggil!');
    try {
      const document = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
      });

      console.log('DocumentPicker.getDocumentAsync selesai dipanggil');

      if (document.type === 'success') {
        console.log('Document URI:', document.uri);
      } else {
        console.log('Document picking cancelled or error:', document);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Gagal memilih dokumen.');
    }
  };

  const handleImageUpload = async () => {
    console.log('handleImageUpload dipanggil!');
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert('Izin akses galeri foto dibutuhkan!');
        return;
      }

      console.log('ImagePicker.launchImageLibraryAsync akan dipanggil');
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      console.log('ImagePicker.launchImageLibraryAsync selesai dipanggil');

      if (pickerResult.canceled === true) {
        return;
      }

      if (pickerResult.assets && pickerResult.assets.length > 0) {
        const selectedImage = pickerResult.assets[0];
        console.log('Image URI:', selectedImage.uri);
      } else {
        console.log('No image selected');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Gagal memilih gambar.');
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
          renderItem={({ item }) => {
            switch (item.type) {
              case 'text':
                return (
                  <View
                    style={[
                      styles.messageContainer,
                      item.sender === 'apoteker' && styles.pharmacistMessageContainer,
                    ]}
                  >
                    <Text style={styles.messageText}>{item.text}</Text>
                  </View>
                );
              case 'document':
                return (
                  <View style={[styles.messageContainer, styles.documentMessageContainer]}>
                    <Feather name="file-text" size={24} color="white" style={styles.documentIcon} />
                    <Text style={[styles.messageText, styles.documentMessageText]}>{item.name}</Text>
                  </View>
                );
              case 'image':
                return (
                  <View style={[styles.imageMessageContainerSimplified]}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.imageMessageImageSimplified}
                      resizeMode="contain"
                    />
                  </View>
                );
              default:
                return (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>Jenis pesan tidak dikenal</Text>
                  </View>
                );
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
          onChangeText={text => setInputText(text)}
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
  attachmentButton: {
    marginRight: 5,
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
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
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
  }
});