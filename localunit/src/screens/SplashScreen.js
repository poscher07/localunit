import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('DivisionScreen');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#071b3a" />
      <View style={styles.icon}>
        <Text style={styles.iconText}>⚡</Text>
      </View>
      <Text style={styles.title}>LocalUnit</Text>
      <Text style={styles.subtitle}>Smart Karnataka Electricity Bill &amp; Usage Tracker</Text>
      <View style={styles.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071b3a',
    padding: 28,
  },
  icon: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderRadius: 26,
    backgroundColor: '#103c68',
  },
  iconText: {
    color: '#27d3e2',
    fontSize: 43,
  },
  title: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 10,
    color: '#b7c9df',
    fontSize: 15,
    textAlign: 'center',
  },
  accent: {
    width: 42,
    height: 4,
    marginTop: 28,
    borderRadius: 4,
    backgroundColor: '#27d3e2',
  },
});
