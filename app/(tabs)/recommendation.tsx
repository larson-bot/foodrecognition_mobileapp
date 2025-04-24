import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

const getDateKey = (date: Date) => `foodLog-${date.toISOString().split('T')[0]}`;

export default function RecommendationScreen() {
  const { date } = useLocalSearchParams();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [foodDetail, setFoodDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const selectedDate = date ? new Date(date as string) : new Date();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) fetchRecommendation(selectedDate);
    });
    return () => unsub();
  }, []);

  const fetchRecommendation = async (date: Date) => {
    try {
      const key = getDateKey(date);
      const data = await AsyncStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : [];
  
      console.log('🍽 Logged Foods:', parsed);
  
      const foodNames = parsed.map((item: any) => item.label || '').filter(Boolean);
      const foodString = foodNames.join(', ');
  
      if (!foodString) {
        setRecommendations(['No logged foods found to recommend from.']);
        return;
      }
  
      console.log('🧠 Sending to Gemini:', foodString);
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBaReAyrYKU9xaBYxXYgbYQyTqyrAncjys`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `The user ate the following foods on ${date.toISOString().split('T')[0]}: ${foodString}. Suggest healthier food alternatives for each item, explain why they're better, and format them as a bullet list.`,
                  },
                ],
              },
            ],
          }),
        }
      );
      
      const dataJson = await response.json();
      console.log('📩 Gemini Response:', dataJson);
  
      if (!dataJson?.candidates || dataJson.candidates.length === 0) {
        setRecommendations(['Gemini did not return any suggestions.']);
        return;
      }
  
      const rawText = dataJson.candidates[0].content.parts[0]?.text || '';
      const cleaned = rawText.split(/\n|\r/).filter((line: string) => line.trim() !== '');
  
      setRecommendations(cleaned);
    } catch (err) {
      console.error('❌ Recommendation fetch failed:', err);
      setRecommendations(['Error fetching recommendations. Please try again.']);
    }
  };

  const fetchFoodDetail = async (name: string) => {
    try {
      setLoading(true);
      const searchRes = await fetch(`https://api.spoonacular.com/food/ingredients/search?query=${name}&number=1&apiKey=a34f6b4a6ca24b9ba6f9b5301782db5b`);
      const searchData = await searchRes.json();
      if (!searchData.results || searchData.results.length === 0) return;
      const id = searchData.results[0].id;
      const infoRes = await fetch(`https://api.spoonacular.com/food/ingredients/${id}/information?amount=100&unit=gram&apiKey=a34f6b4a6ca24b9ba6f9b5301782db5b`);
      const detail = await infoRes.json();
      setFoodDetail(detail);
      setSelectedItem(name);
    } catch (err) {
      console.error('Food detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecommendation(selectedDate);
    setRefreshing(false);
  }, [selectedDate]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Recommendations for {selectedDate.toISOString().split('T')[0]}</Text>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingTop: 16 }}
        >
          {recommendations.length === 0 ? (
            <Text style={styles.recommendationBox}>No recommendations available.</Text>
          ) : (
            recommendations.map((rec, idx) => (
              <TouchableOpacity key={idx} onPress={() => fetchFoodDetail(rec)}>
                <Text style={styles.recommendationBox}>{rec}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  recommendationBox: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
});