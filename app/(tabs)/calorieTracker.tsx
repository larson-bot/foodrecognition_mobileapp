import { useEffect, useState } from 'react'; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Redirect, useRouter } from 'expo-router';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getDateKey = (date: Date) => `foodLog-${date.toISOString().split('T')[0]}`;

export default function CalorieTrackerScreen() {
  const [calories, setCalories] = useState(0);
  const [macros, setMacros] = useState({ protein: 0, fat: 0, carbs: 0 });
  const [targets, setTargets] = useState({ calories: 2000, protein: 150, fat: 50, carbs: 250 });
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loggedFoods, setLoggedFoods] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  const updateCaloriesAndMacros = (foods: any[]) => {
    let total = 0, protein = 0, fat = 0, carbs = 0;
    foods.forEach((entry) => {
      const factor = entry.grams / 100;
      total += entry.calories * factor;
      entry.nutrition?.nutrients?.forEach((n: any) => {
        if (n.name === 'Protein') protein += n.amount * factor;
        if (n.name === 'Fat') fat += n.amount * factor;
        if (n.name === 'Carbohydrates') carbs += n.amount * factor;
      });
    });
    setCalories(total);
    setMacros({ protein, fat, carbs });
  };

  const loadLogs = async (date = selectedDate, uid?: string) => {
    try {
      const key = getDateKey(date);
      const snapshot = await getDoc(doc(db, 'foodLogs', `${uid}_${key}`));
      const parsed = snapshot.exists() ? snapshot.data().items || [] : [];
      parsed.forEach((item: any) => {
        if (!item.grams) item.grams = 100;
      });
      setLoggedFoods(parsed);
      updateCaloriesAndMacros(parsed);
      await AsyncStorage.setItem(key, JSON.stringify(parsed)); // 🔄 Sync for recommendation
    } catch (err) {
      console.error('Failed to load calorie log:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const profile = await getDoc(doc(db, 'users', user.uid));
        if (profile.exists()) {
          const data = profile.data();
          setTargets({
            calories: data.calories || 2000,
            protein: data.protein || 150,
            fat: data.fats || 50,
            carbs: data.carbs || 250,
          });
        }
        loadLogs(selectedDate, user.uid);
      } else {
        setIsAuthenticated(false);
      }
      setIsMounted(true);
    });
    return () => unsubscribe();
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    const user = auth.currentUser;
    if (user) await loadLogs(selectedDate, user.uid);
    setRefreshing(false);
  };

  const updateGrams = async (index: number, newGrams: number) => {
    const updated = [...loggedFoods];
    updated[index].grams = newGrams;
    setLoggedFoods(updated);
    updateCaloriesAndMacros(updated);
    const user = auth.currentUser;
    if (user) {
      const key = getDateKey(selectedDate);
      await setDoc(doc(db, 'foodLogs', `${user.uid}_${key}`), { items: updated });
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    }
  };

  const removeFoodItem = async (indexToRemove: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const key = getDateKey(selectedDate);
    const updated = loggedFoods.filter((_, i) => i !== indexToRemove);

    setLoggedFoods(updated);
    updateCaloriesAndMacros(updated);

    await setDoc(doc(db, 'foodLogs', `${user.uid}_${key}`), { items: updated });
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  };

  const ProgressBox = ({ label, value, target }: any) => {
    const percent = Math.min((value / target) * 100, 100);
    return (
      <View style={styles.progressBox}>
        <AnimatedCircularProgress
          size={100}
          width={10}
          fill={percent}
          tintColor="#4CAF50"
          backgroundColor="#e0e0e0"
        >
          {() => <Text style={{ fontWeight: 'bold' }}>{Math.round(percent)}%</Text>}
        </AnimatedCircularProgress>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value.toFixed(1)} / {target} {label === 'Calories' ? 'kcal' : 'g'}
        </Text>
      </View>
    );
  };

  if (!isMounted) return null;
  if (isAuthenticated === false) return <Redirect href="/auth/login" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Nutritional Progress</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>{selectedDate.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(e, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.section}>
          <ProgressBox label="Calories" value={calories} target={targets.calories} />
        </View>

        <Text style={[styles.title, { marginTop: 24 }]}>Macros</Text>
        <View style={styles.macrosContainer}>
          <ProgressBox label="Protein" value={macros.protein} target={targets.protein} />
          <ProgressBox label="Fat" value={macros.fat} target={targets.fat} />
          <ProgressBox label="Carbs" value={macros.carbs} target={targets.carbs} />
        </View>

        <Text style={[styles.title, { marginTop: 24 }]}>Logged Foods</Text>
        {loggedFoods.length > 0 ? (
          loggedFoods.map((item, index) => (
            <View key={index} style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600' }}>{item.label || 'Unknown Item'}</Text>
              <Text style={{ color: '#555' }}>{((item.calories * item.grams) / 100).toFixed(1)} kcal ({item.grams}g)</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="Adjust grams"
                value={String(item.grams)}
                onChangeText={(text) => {
                  const grams = parseFloat(text);
                  if (!isNaN(grams)) updateGrams(index, grams);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginTop: 6,
                  marginBottom: 4,
                }}
              />
              <TouchableOpacity
                onPress={() => removeFoodItem(index)}
                style={{
                  backgroundColor: '#d9534f',
                  padding: 8,
                  borderRadius: 6,
                  marginTop: 4,
                  alignSelf: 'flex-start'
                }}
              >
                <Text style={{ color: '#fff' }}>Remove</Text>
              </TouchableOpacity>
              {item.timestamp && (
                <Text style={{ color: '#888', fontSize: 12 }}>
                  Logged at: {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={{ fontStyle: 'italic', color: '#888' }}>No foods logged.</Text>
        )}

        <Button
          title="Get Recommendations"
          onPress={() => router.push({ pathname: '/recommendation', params: { date: selectedDate.toISOString() } })}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/settings')}
      >
        <Ionicons name="settings-outline" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold' },
  section: { alignItems: 'center', marginVertical: 16 },
  macrosContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  progressBox: { alignItems: 'center', flex: 1 },
  label: { fontSize: 16, marginTop: 8, fontWeight: '600' },
  value: { fontSize: 14, color: '#666' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateButton: { padding: 8, borderRadius: 6, backgroundColor: '#eeeeee' },
  dateText: { fontSize: 14, fontWeight: '500' },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
