require('dotenv').config(); // Load environment variables from .env file - ADDED

import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons'; // Import Feather Icons

export default function App() {
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([
    { id: '1', sender: 'apoteker', type: 'text', text: 'Selamat datang! Ada yang bisa saya bantu?' },
    { id: '2', sender: 'pasien', type: 'text', text: 'Halo, saya mau bertanya tentang obat demam.' },
    { id: '3', sender: 'apoteker', type: 'text', text: 'Tentu, obat demam apa yang Anda maksud?' },
    { id: '4', sender: 'pasien', type: 'document', name: 'Dokumen Penting.pdf', uri: 'file://dummy-document-uri.pdf', fileType: 'application/pdf' }, // Pesan dokumen contoh
    { id: '5', sender: 'pasien', type: 'image', uri: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png' }, // Pesan gambar contoh - GOOGLE LOGO
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendButtonPress = async () => { // Tambahkan async
    if (inputText.trim() !== '') {
      const newMessage = {
        id: String(messages.length + 1),
        sender: 'pasien',
        type: 'text',
        text: inputText.trim(),
      };

      // Kirim pesan ke backend server menggunakan fetch API
      try {
        const response = await fetch(process.env.BACKEND_API_URL + '/messages', { // Use process.env.BACKEND_API_URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMessage), // Kirim pesan dalam format JSON
        });

        if (!response.ok) { // Cek jika response tidak OK (kode status bukan 200-299)
          throw new Error(`HTTP error! status: ${response.status}`); // Lempar error jika response tidak OK
        }

        const responseData = await response.json(); // Baca response JSON dari server
        console.log('Response dari server:', responseData); // Log response dari server

        setMessages([...messages, newMessage]); // Tambahkan pesan ke state messages (tetap ada)
        setInputText('');
        flatListRef.current?.scrollToEnd({ animated: true });

      } catch (error) { // Tangkap error jika terjadi kesalahan saat fetch
        console.error('Gagal mengirim pesan ke server:', error); // Log error ke konsol
        alert('Gagal mengirim pesan. Coba lagi nanti.'); // Tampilkan alert ke pengguna (opsional)
      }
    }
  };

  const handleDocumentUpload = async () => {
    console.log('handleDocumentUpload dipanggil!'); // Log 1: Awal fungsi
    try {
      const document = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
      });

      console.log('DocumentPicker.getDocumentAsync selesai dipanggil'); // Log 2: Setelah DocumentPicker

      if (document.type === 'success') {
        console.log('Document URI:', document.uri); // Log URI (tetap ada)
        // alert(`Dokumen terpilih: ${document.name}`); // Alert dihapus
        // ... (kode pembuatan pesan dihapus sementara) ...
      } else {
        console.log('Document picking cancelled or error:', document);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Gagal memilih dokumen.');
    }
  };

  const handleImageUpload = async () => {
    console.log('handleImageUpload dipanggil!'); // Log 1: Awal fungsi
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert('Izin akses galeri foto dibutuhkan!');
        return;
      }

      console.log('ImagePicker.launchImageLibraryAsync akan dipanggil'); // Log 2: Sebelum ImagePicker
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      console.log('ImagePicker.launchImageLibraryAsync selesai dipanggil'); // Log 3: Setelah ImagePicker

      if (pickerResult.canceled === true) {
        return;
      }

      if (pickerResult.assets && pickerResult.assets.length > 0) {
        const selectedImage = pickerResult.assets[0];
        console.log('Image URI:', selectedImage.uri); // Log URI (tetap ada)
        // alert(`Gambar terpilih: ${selectedImage.fileName || 'image'}`); // Alert dihapus
        // ... (kode pembuatan pesan dihapus sementara) ...
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
                  <View style={[styles.imageMessageContainerSimplified]}> {/* Use simplified style */}
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.imageMessageImageSimplified} // Use simplified style
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
        <Button title="Dokumen" style={styles.attachmentButton} onPress={() => console.log('Tombol Dokumen ditekan!')} /> {/* Tombol Dokumen - Tes Langsung */}
        <Button title="Gambar" style={styles.attachmentButton} onPress={() => console.log('Tombol Gambar ditekan!')} />   {/* Tombol Gambar - Tes Langsung */}
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
    backgroundColor: '#607D8B', // Warna abu-abu kebiruan untuk dokumen
    flexDirection: 'row', // Agar ikon dan teks berdampingan
    alignItems: 'center', // Agar ikon dan teks sejajar vertikal
  },
  documentMessageText: {
    marginLeft: 10, // Jarak antara ikon dan teks dokumen
    flex: 1, // Agar teks dokumen memenuhi ruang yang tersedia
  },
  documentIcon: {
    marginLeft: 5,
  },
  imageMessageContainerSimplified: { // SIMPLIFIED STYLE
    // paddingVertical: 5, // Removed padding
    backgroundColor: 'transparent', // Keep transparent background
    width: 150,  // Explicit width
    height: 150, // Explicit height
  },
  imageMessageImageSimplified: { // SIMPLIFIED STYLE
    width: 150, // Explicit width - same as container
    height: 150, // Explicit height - same as container
    // borderRadius: 10, // Removed borderRadius for simplicity
  },
  imageMessageContainer: { // OLD STYLE - NOT USED
    paddingVertical: 5,
    backgroundColor: 'transparent',
  },
  imageMessageImage: { // OLD STYLE - NOT USED
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});