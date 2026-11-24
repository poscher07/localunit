import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen({ navigation }: { navigation: any }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('CategoryScreen');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>LocalUnit</Text>
        <Text style={styles.tagline}>Smart MESCOM Bill & Usage Tracker</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tagline: {
    fontSize: 16,
    color: '#a0c4e8',
    marginTop: 8,
  },
});