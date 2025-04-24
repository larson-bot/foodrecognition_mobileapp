import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '@/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ExploreScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [FoodLabels, setFoodLabels] = useState<string[]>([]);
  const [nutritionList, setNutritionList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll access is needed to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      processFoodRecognition(uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      processFoodRecognition(uri);
    }
  };

  const processFoodRecognition = async (imagePath: string) => {
    try {
      setLoading(true);
      setFoodLabels([]);
      setNutritionList([]);

      const formData = new FormData();
      formData.append('file', {
        uri: imagePath,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch('http://192.168.0.2:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const data = await response.json();
      console.log('YOLO result:', data);

      const labels = data.labels || (data.label ? [data.label] : []);
      if (labels.length === 0) {
        Alert.alert('No food detected.');
        return;
      }

      setFoodLabels(labels);

      const fetchedNutritions = [];
      const notFound: string[] = [];

      for (const label of labels) {
        const searchRes = await fetch(
          `https://api.spoonacular.com/recipes/complexSearch?query=${label}&number=1&addRecipeNutrition=true&apiKey=a34f6b4a6ca24b9ba6f9b5301782db5b`
        );
        const searchData = await searchRes.json();

        if (!searchData.results || searchData.results.length === 0) {
          console.warn(`No nutrition data found for ${label}`);
          notFound.push(label);
          continue;
        }

        const result = searchData.results[0];
        fetchedNutritions.push({ label, data: result.nutrition });
      }

      if (fetchedNutritions.length === 0) {
        Alert.alert('No nutrition info found for any items.');
      } else if (notFound.length > 0) {
        Alert.alert('Partial Results', `No nutrition info found for: ${notFound.join(', ')}`);
      }

      setNutritionList(fetchedNutritions);
    } catch (error) {
      console.error('Recognition error:', error);
      Alert.alert('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const logToProgress = async (item: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const todayKey = `foodLog-${new Date().toISOString().split('T')[0]}`;
      const docRef = doc(db, 'foodLogs', `${user.uid}_${todayKey}`);
      const snapshot = await getDoc(docRef);
      const existing = snapshot.exists() ? snapshot.data().items || [] : [];

      const newEntry = {
        label: item.label,
        calories: item.data.nutrients.find((n: any) => n.name === 'Calories')?.amount || 0,
        nutrition: item.data,
        grams: 100,
        timestamp: Date.now(),
      };

      await setDoc(docRef, { items: [...existing, newEntry] });
      Alert.alert('Added to Daily Progress');
    } catch (err) {
      console.error('Log error:', err);
      Alert.alert('Failed to log this item.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <ThemedText type="title">Food Recognition</ThemedText>

          <View style={{ marginVertical: 10 }}>
            <Button title="Upload Image" onPress={pickImage} />
            <View style={{ height: 10 }} />
            <Button title="Take Photo" onPress={takePhoto} />
          </View>

          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 16 }}
            />
          )}

          {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

          {!loading && nutritionList.length > 0 && (
            <View style={{ marginTop: 20 }}>
              {nutritionList.map((item, index) => (
                <View key={index} style={{ marginBottom: 24 }}>
                  <ThemedText type="subtitle">Detected Food: {item.label}</ThemedText>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>
                    Nutrition per 100g:
                  </Text>

                  {item.data.nutrients
                    .filter((n: any) =>
                      ['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Fiber'].includes(n.name)
                    )
                    .map((n: any) => (
                      <Text key={n.name}>
                        {n.name}: {n.amount} {n.unit}
                      </Text>
                    ))}

                  <TouchableOpacity
                    onPress={() => logToProgress(item)}
                    style={{ backgroundColor: '#4CAF50', padding: 10, borderRadius: 8, marginTop: 10 }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center' }}>Add to Daily Progress</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}