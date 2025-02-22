import React, { useState, useRef, useEffect } from 'react'; // ADDED useEffect import
import { StyleSheet, Text, View, TextInput, Button, FlatList, Image, requestAnimationFrame } from 'react-native'; // ADDED requestAnimationFrame import
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons'; // Import Feather Icons
import Constants from 'expo-constants'; // ADDED import Constants

const backendUri = 'https://864412fa-f453-4841-8473-1b97e7555524-00-1uikfcb9cs0wd.pike.replit.dev'; // KONSTANTA backendUri - **GANTI DENGAN URL BACKEND ANDA!**

export default function App() {
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([]); // State messages awalnya kosong!
  const [inputText, setInputText] = useState('');

  // const fetchMessages = async () => { // Fungsi terpisah untuk mengambil pesan dari server - POLLING DINONAKTIFKAN
  //   try {
  //     const response = await fetch(backendUri + '/getMessages'); // Panggil endpoint /getMessages - MENGGUNAKAN KONSTANTA backendUri
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
  //     const responseData = await response.json(); // Parse response JSON
  //     console.log('Pesan diterima dari server (polling/awal):', responseData); // Log pesan dari server
  //     setMessages(responseData); // Update state messages dengan pesan dari server
  //   } catch (error) {
  //     console.error('Gagal mengambil pesan dari server:', error);
  //     // alert('Gagal mengambil pesan. Coba lagi nanti.'); // Alert error (opsional)
  //   }
  // };

  // useEffect(() => { // useEffect hook untuk mengambil pesan awal dan polling - POLLING DINONAKTIFKAN
  //   fetchMessages(); // Panggil fetchMessages saat komponen mount (pertama kali render)

  //   const intervalId = setInterval(() => { // Set up polling setiap 3 detik
  //     fetchMessages(); // Panggil fetchMessages setiap interval
  //     }, 3000); // Interval 3000ms (3 detik)

  //   return () => clearInterval(intervalId); // Clean up interval saat komponen unmount
  // }, []); // useEffect hanya dijalankan sekali saat komponen mount (array dependensi kosong [])


  const handleSendButtonPress = async () => { // Fungsi handleSendButtonPress (tidak berubah dari sebelumnya)
    if (inputText.trim() !== '') {
      const newMessage = {
        id: String(messages.length + 1),
        sender: 'pasien',
        type: 'text',
        text: inputText.trim(),
      };

      // Kirim pesan ke backend server menggunakan fetch API
      try {
        const response = await fetch(backendUri + '/messages', { // Use Constants.expoConfig.extra.BACKEND_API_URL - MENGGUNAKAN KONSTANTA backendUri
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMessage), // Kirim pesan dalam format JSON
        });

        console.log('Response ok:', response.ok);
        console.log('Response status:', response.status);
        console.log('Full Response object:', response); // TAMBAHKAN LOG FULL RESPONSE OBJECT

        const responseData = await response.json(); // Baca response JSON dari server
        console.log('Response dari server:', responseData);

        setMessages([...messages, newMessage]); // Tambahkan pesan ke state messages (tetap ada)
        setInputText('');
        // REMOVE setTimeout AND requestAnimationFrame FROM HERE - AUTO-SCROLL NOW HANDLED BY onContentSizeChange

      // } catch (error) { // Tangkap error jika terjadi kesalahan saat fetch - COMMENT OUT ENTIRE CATCH BLOCK
      //   console.error('Gagal mengirim pesan ke server:', error); // Log error ke konsol (tetap ada)
      //   console.error('Full error object:', error); // TAMBAHKAN LOG FULL ERROR OBJECT
      //   alert('Gagal mengirim pesan. Coba lagi nanti.'); // Tampilkan alert ke pengguna (opsional)
      } // COMMENT OUT ENTIRE CATCH BLOCK
    }
  };

  const handleDocumentUpload = async () => { // Fungsi handleDocumentUpload (tidak berubah)
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

  const handleImageUpload = async () => { // Fungsi handleImageUpload (tidak berubah)
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
          onContentSizeChange={() => { // ADD onContentSizeChange FOR AUTO-SCROLL
            flatListRef.current?.scrollToEnd({ animated: true });
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