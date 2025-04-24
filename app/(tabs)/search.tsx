import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { db, auth } from '@/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const getTodayKey = () => `foodLog-${new Date().toISOString().split('T')[0]}`;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: number; name: string; image: string }[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [foodDetail, setFoodDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.spoonacular.com/food/ingredients/search?query=${text}&number=10&apiKey=a34f6b4a6ca24b9ba6f9b5301782db5b`
      );
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      console.error('API error:', err);
    }
  };

  const fetchFoodDetail = async (id: number) => {
    setLoadingDetail(true);
    setSelectedFoodId(id);
    try {
      const response = await fetch(
        `https://api.spoonacular.com/food/ingredients/${id}/information?amount=100&unit=gram&apiKey=a34f6b4a6ca24b9ba6f9b5301782db5b`
      );
      const data = await response.json();
      setFoodDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const logFood = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const todayKey = getTodayKey();
      const docRef = doc(db, 'foodLogs', `${user.uid}_${todayKey}`);
      const snapshot = await getDoc(docRef);
      const prevItems = snapshot.exists() ? snapshot.data().items || [] : [];

      const calories = foodDetail?.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0;

      const foodItem = {
        label: foodDetail.name,
        id: foodDetail.id,
        image: foodDetail.image,
        calories,
        nutrition: foodDetail.nutrition,
        grams: 100,
        timestamp: new Date().toISOString(),
      };

      await setDoc(docRef, { items: [...prevItems, foodItem] });
      Alert.alert('Logged', `${foodDetail.name} has been added to your log.`);
    } catch (err) {
      console.error('Failed to log food:', err);
      Alert.alert('Error', 'Could not save the food log.');
    }
  };

  const renderSearchView = () => (
    <>
      <ThemedText type="title">Search Food</ThemedText>
      <TextInput
        style={{
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 10,
          marginVertical: 10,
        }}
        placeholder="Search for food..."
        value={query}
        onChangeText={handleSearch}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => fetchFoodDetail(item.id)}>
            <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
              <Image
                source={{ uri: `https://spoonacular.com/cdn/ingredients_100x100/${item.image}` }}
                style={{ width: 60, height: 60, borderRadius: 8, marginRight: 10 }}
              />
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  );

  const renderDetailView = () => {
    if (loadingDetail) return <ActivityIndicator style={{ marginTop: 50 }} />;

    const findNutrient = (name: string) =>
      foodDetail?.nutrition?.nutrients?.find((n: any) => n.name === name)?.amount ?? 'N/A';

    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={() => setSelectedFoodId(null)}>
          <Text style={{ color: 'blue', marginBottom: 10 }}>← Back to search</Text>
        </TouchableOpacity>

        <Image
          source={{ uri: `https://spoonacular.com/cdn/ingredients_500x500/${foodDetail.image}` }}
          style={{ height: 200, borderRadius: 12 }}
        />
        <Text style={{ fontSize: 26, fontWeight: 'bold', marginTop: 10, marginBottom: 8 }}>
          {foodDetail.name}
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>Aisle: {foodDetail.aisle || 'N/A'}</Text>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Nutrition per 100g:</Text>
          {['Calories', 'Protein', 'Fat', 'Carbohydrates'].map((label) => (
            <Text key={label} style={{ fontSize: 14, marginTop: 4 }}>
              {label}: {findNutrient(label)} {label === 'Calories' ? 'kcal' : 'g'}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: '#4CAF50',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={logFood}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Log This Food</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1, padding: 16 }}>
        {selectedFoodId === null ? renderSearchView() : renderDetailView()}
      </ThemedView>
    </SafeAreaView>
  );
}