import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<'maintain' | 'gain' | 'lose'>('maintain');
  const [open, setOpen] = useState(false);

  const calculateNutritionTargets = (w: number, h: number, g: 'maintain' | 'gain' | 'lose') => {
    const bmr = 10 * w + 6.25 * h - 5 * 25 + 5;
    const multiplier = g === 'gain' ? 1.15 : g === 'lose' ? 0.85 : 1.0;
    const calories = bmr * multiplier;
    return {
      calories: Math.round(calories),
      protein: Math.round((calories * 0.3) / 4),
      carbs: Math.round((calories * 0.4) / 4),
      fats: Math.round((calories * 0.3) / 9),
    };
  };

  const handleSignUp = async () => {
    if (!email || !password || !weight || !height) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const nutrition = calculateNutritionTargets(Number(weight), Number(height), goal);

      await setDoc(doc(db, 'users', uid), {
        email,
        createdAt: new Date().toISOString(),
        goal,
        weight: Number(weight),
        height: Number(height),
        ...nutrition,
      });

      Alert.alert('Success', 'Account created!');
      router.replace('/auth/login');
      setTimeout(() => {
        router.replace('/');
      }, 200);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calurfood</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TextInput
        placeholder="Weight (kg)"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
        style={styles.input}
      />
      <TextInput
        placeholder="Height (cm)"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
        style={styles.input}
      />
      <Text style={styles.label}>Goal</Text>
      <DropDownPicker
        open={open}
        value={goal}
        items={[
          { label: 'Maintain Weight', value: 'maintain' },
          { label: 'Gain Weight', value: 'gain' },
          { label: 'Lose Weight', value: 'lose' },
        ]}
        setOpen={setOpen}
        setValue={setGoal}
        style={{ marginBottom: open ? 120 : 16 }}
        zIndex={1000}
      />
      <Button title="Sign Up" onPress={handleSignUp} />
      <Button title="Already have an account? Login" onPress={() => router.push('/auth/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#28a745',
    marginBottom: 24,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 16,
    fontSize: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: 'bold',
  },
});