import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DivisionHeader from '../components/DivisionHeader';
import { getEscomDivision } from '../data/escomDivisions';

const categories = [
  {
    name: 'Domestic',
    subtitle: 'Home and residential electricity',
    icon: '⌂',
  },
  {
    name: 'Commercial',
    subtitle: 'Business and commercial electricity',
    icon: '▦',
  },
];

export default function CategoryScreen({ navigation, route }) {
  const divisionCode = route.params?.divisionCode;
  const division = getEscomDivision(divisionCode);
  const [savingCategory, setSavingCategory] = useState(false);

  const changeDivision = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'DivisionScreen' }],
    });
  };

  const selectCategory = async (category) => {
    if (!division) {
      Alert.alert('Choose a division', 'Select your Karnataka ESCOM division first.');
      return;
    }

    setSavingCategory(true);
    try {
      await AsyncStorage.setItem(`selectedCategory:${division.code}`, category);
      navigation.navigate('LoginScreen', { category, divisionCode: division.code });
    } catch (error) {
      Alert.alert(
        'Could not save category',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSavingCategory(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <DivisionHeader
          category="Select category"
          division={division}
          onChangeDivision={changeDivision}
        />
        <View style={styles.eyebrow}>
          <View
            style={[
              styles.eyebrowDot,
              { backgroundColor: division?.accentColor || '#20becf' },
            ]}
          />
          <Text style={styles.eyebrowText}>ESCOM ACCOUNT</Text>
        </View>
        <Text style={styles.title}>Choose your{'\n'}account type</Text>
        <Text style={styles.description}>
          Select the category linked to your electricity connection.
        </Text>

        <View style={styles.cards}>
          {categories.map((category) => (
            <Pressable
              accessibilityRole="button"
              disabled={savingCategory}
              key={category.name}
              onPress={() => selectCategory(category.name)}
              style={({ pressed }) => [
                styles.card,
                division && { borderColor: `${division.accentColor}40` },
                pressed && styles.cardPressed,
              ]}
            >
              <View
                style={[
                  styles.cardIcon,
                  division && { backgroundColor: `${division.accentColor}18` },
                ]}
              >
                <Text
                  style={[
                    styles.cardIconText,
                    division && { color: division.accentColor },
                  ]}
                >
                  {category.icon}
                </Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{category.name}</Text>
                <Text style={styles.cardSubtitle}>{category.subtitle}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footnote}>
          Your category is saved on this device for your convenience.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f7fc',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  eyebrowDot: {
    width: 8,
    height: 8,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#20becf',
  },
  eyebrowText: {
    color: '#477093',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#0a2347',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 41,
  },
  description: {
    maxWidth: 310,
    marginTop: 12,
    color: '#647a93',
    fontSize: 15,
    lineHeight: 23,
  },
  cards: {
    gap: 14,
    marginTop: 34,
  },
  card: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: '#e1eaf3',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  cardPressed: {
    borderColor: '#20becf',
    backgroundColor: '#f7feff',
  },
  cardIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#e9f8fb',
  },
  cardIconText: {
    color: '#087e9d',
    fontSize: 28,
    fontWeight: '700',
  },
  cardCopy: {
    flex: 1,
    marginLeft: 15,
  },
  cardTitle: {
    color: '#0a2347',
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 5,
    color: '#71849a',
    fontSize: 12,
    lineHeight: 17,
  },
  arrow: {
    marginLeft: 8,
    color: '#16849d',
    fontSize: 30,
  },
  footnote: {
    marginTop: 28,
    color: '#8393a6',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
