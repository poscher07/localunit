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
import { ESCOM_DIVISIONS } from '../data/escomDivisions';

export default function DivisionScreen({ navigation }) {
  const [savingDivision, setSavingDivision] = useState(false);

  const selectDivision = async (division) => {
    setSavingDivision(true);
    try {
      await AsyncStorage.setItem('selectedDivision', division.code);
      navigation.reset({
        index: 0,
        routes: [{ name: 'CategoryScreen', params: { divisionCode: division.code } }],
      });
    } catch (error) {
      Alert.alert(
        'Could not save division',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSavingDivision(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.eyebrow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>KARNATAKA ELECTRICITY</Text>
        </View>
        <Text style={styles.title}>Choose your{'\n'}supply division</Text>
        <Text style={styles.description}>
          Select the ESCOM serving your electricity connection.
        </Text>

        <View style={styles.cards}>
          {ESCOM_DIVISIONS.map((division) => (
            <Pressable
              accessibilityRole="button"
              disabled={savingDivision}
              key={division.code}
              onPress={() => selectDivision(division)}
              style={({ pressed }) => [
                styles.card,
                { borderLeftColor: division.accentColor },
                pressed && { backgroundColor: `${division.accentColor}0c` },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.codeBadge,
                    { backgroundColor: `${division.accentColor}18` },
                  ]}
                >
                  <Text style={[styles.codeText, { color: division.accentColor }]}>
                    {division.code}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
              <Text style={styles.cardTitle}>{division.name}</Text>
              <Text style={styles.headquarters}>
                Headquarters · {division.headquarters}
              </Text>
              <Text style={styles.districts}>
                Districts · {division.districts.join(' · ')}
              </Text>
            </Pressable>
          ))}
        </View>
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
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 28,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: '#0a2347',
    fontSize: 33,
    fontWeight: '800',
    lineHeight: 40,
  },
  description: {
    marginTop: 10,
    color: '#647a93',
    fontSize: 14,
    lineHeight: 21,
  },
  cards: {
    gap: 12,
    marginTop: 24,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#e1eaf3',
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  arrow: {
    color: '#7790a7',
    fontSize: 25,
    lineHeight: 26,
  },
  cardTitle: {
    marginTop: 11,
    color: '#0a2347',
    fontSize: 15,
    fontWeight: '800',
  },
  headquarters: {
    marginTop: 5,
    color: '#477093',
    fontSize: 11,
    fontWeight: '700',
  },
  districts: {
    marginTop: 7,
    color: '#71849a',
    fontSize: 11,
    lineHeight: 17,
  },
});
