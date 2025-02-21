import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, Image } from 'react-native'; // Tambahkan Image di import
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([
    { id: '4', sender: 'pasien', type: 'image', uri: 'https://via.placeholder.com/200' }, // Pesan gambar contoh
    { id: '5', sender: 'pasien', type: 'document', name: 'Contoh Dokumen.pdf' }, // Pesan dokumen contoh
    { id: '1', sender: 'apoteker', type: 'text', text: 'Selamat datang! Ada yang bisa saya bantu?' },
    { id: '2', sender: 'pasien', type: 'text', text: 'Halo, saya mau bertanya tentang obat demam.' },
    { id: '3', sender: 'apoteker', type: 'text', text: 'Tentu, obat demam apa yang Anda maksud?' },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendButtonPress = () => {
    if (inputText.trim() !== '') {
      const newMessage = {
        id: String(messages.length + 1),
        sender: 'pasien',
        type: 'text',
        text: inputText.trim(),
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      flatListRef.current?.scrollToEnd({ animated: true });
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
        // alert(`Dokumen terpilih: ${document.name}`);

        const newMessage = {
          id: String(messages.length + 1),
          sender: 'pasien',
          type: 'document',
          name: document.name,
          uri: document.uri,
          fileType: document.mimeType,
        };
        setMessages([...messages, newMessage]);
        flatListRef.current?.scrollToEnd({ animated: true });
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
        // alert(`Gambar terpilih: ${selectedImage.fileName || 'image'}`);

        const newMessage = {
          id: String(messages.length + 1),
          sender: 'pasien',
          type: 'image',
          uri: selectedImage.uri,
        };
        setMessages([...messages, newMessage]);
        flatListRef.current?.scrollToEnd({ animated: true });
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
            let messageContent;

            if (item.type === 'text') {
              messageContent = (
                <Text style={styles.messageText}>{item.text}</Text>
              );
            } else if (item.type === 'image') {
              messageContent = (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.messageImage}
                />
              );
            } else if (item.type === 'document') {
              messageContent = (
                <View style={styles.documentContainer}>
                  <Text style={styles.documentText}>Dokumen: {item.name}</Text>
                </View>
              );
            } else {
              messageContent = (
                <Text style={styles.messageText}>Jenis pesan tidak dikenal</Text>
              );
            }

            return (
              <View
                style={[
                  styles.messageContainer,
                  item.sender === 'apoteker' && styles.pharmacistMessageContainer,
                ]}
              >
                {messageContent}
              </View>
            );
          }}
        />
      </View>

      <View style={styles.inputArea}>
        <Button title="Dokumen" style={styles.attachmentButton} onPress={() => console.log('Tombol Dokumen ditekan!')} />
        <Button title="Gambar" style={styles.attachmentButton} onPress={() => console.log('Tombol Gambar ditekan!')} />
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
  messageImage: { // Style untuk pesan gambar
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
    resizeMode: 'cover',
  },
  documentContainer: { // Style untuk container pesan dokumen
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  documentText: { // Style untuk teks nama dokumen
    color: 'white',
    fontSize: 16,
  },
});