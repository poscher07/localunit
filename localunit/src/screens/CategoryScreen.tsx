import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CategoryScreen({ navigation }: { navigation: any }) {
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    const storedCategory = AsyncStorage.getItem('selectedCategory');
    storedCategory.then(val => {
      if (val !== null) {
        setCategory(val);
        navigation.navigate('LoginScreen', { category: val });
      }
    });
  }, [navigation]);

  const selectCategory = async (cat: string) => {
    await AsyncStorage.setItem('selectedCategory', cat);
    setCategory(cat);
    navigation.navigate('LoginScreen', { category: cat });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select User Category</Text>
      {category && <Text style={styles.selected}>Selected: {category}</Text>}
      <TouchableOpacity style={styles.card} onPress={() => selectCategory('Domestic')}>
        <Text style={styles.cardText}>Domestic</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => selectCategory('Commercial')}>
        <Text style={styles.cardText}>Commercial</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1a365d',
  },
  selected: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a365d',
  },
});