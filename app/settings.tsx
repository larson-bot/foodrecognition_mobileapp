import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { auth, db } from '@/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [targets, setTargets] = useState({
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setTargets({
          calories: data.calories?.toString() || '',
          protein: data.protein?.toString() || '',
          fat: data.fats?.toString() || '',
          carbs: data.carbs?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
        });
      }
    };

    fetchUserData();
  }, []);

  const calculateTargets = (weight: number, height: number) => {
    const calories = Math.round(22 * weight + 500);
    const protein = Math.round(weight * 1.6);
    const fat = Math.round(weight * 0.8);
    const carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
    return { calories, protein, fat, carbs };
  };

  const updateField = (field: string, value: string) => {
    let newTargets = { ...targets, [field]: value };

    if (field === 'weight' || field === 'height') {
      const weight = parseFloat(field === 'weight' ? value : newTargets.weight);
      const height = parseFloat(field === 'height' ? value : newTargets.height);
      if (!isNaN(weight) && !isNaN(height)) {
        const newCalcs = calculateTargets(weight, height);
        newTargets = {
          ...newTargets,
          calories: newCalcs.calories.toString(),
          protein: newCalcs.protein.toString(),
          fat: newCalcs.fat.toString(),
          carbs: newCalcs.carbs.toString(),
        };
      }
    }

    setTargets(newTargets);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        calories: parseFloat(targets.calories),
        protein: parseFloat(targets.protein),
        fats: parseFloat(targets.fat),
        carbs: parseFloat(targets.carbs),
        weight: parseFloat(targets.weight),
        height: parseFloat(targets.height),
      });
      Alert.alert('Saved', 'Your goals have been updated!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update goals.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Calurfood</Text>
      <Text style={styles.subHeader}>Personal Nutrition & Fitness Settings</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {[
          { label: 'Total Calories (kcal)', key: 'calories' },
          { label: 'Total Protein (g)', key: 'protein' },
          { label: 'Total Fat (g)', key: 'fat' },
          { label: 'Total Carbs (g)', key: 'carbs' },
          { label: 'Current Weight (kg)', key: 'weight' },
          { label: 'Current Height (cm)', key: 'height' },
        ].map(field => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              value={targets[field.key]}
              onChangeText={(val) => updateField(field.key, val)}
              placeholder={`Enter ${field.label}`}
            />
          </View>
        ))}

        <Button title="Save Changes" onPress={handleSave} color="#28a745" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 6, color: '#28a745' },
  subHeader: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#666' },
  inputGroup: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 6, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
});
