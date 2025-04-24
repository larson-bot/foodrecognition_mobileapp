import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '@/firebaseConfig';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function UserProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }

    try {
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      console.error('Password update error:', err);
      Alert.alert('Error', 'Failed to update password.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.header}>User Profile</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{email}</Text>
      </View>

      <Text style={[styles.label, { marginTop: 20 }]}>Change Password</Text>
      <TextInput
        placeholder="Current Password"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        style={styles.input}
      />
      <TextInput
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
      />
      <Button title="Update Password" onPress={handleChangePassword} color="#007AFF" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  infoBox: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  value: { fontSize: 16, color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
});