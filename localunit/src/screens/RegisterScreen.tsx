import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [mescomId, setMescomId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState '';

  const handleRegister = async () => {
    if (!fullName || !mescomId || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name: fullName,
      userId: mescomId,
      password,
    };

    const storedUsers = await AsyncStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    users.push(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(users));

    Alert.alert('Success', 'Account created successfully! Please login.');
    navigation.navigate('LoginScreen');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        
        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="MESCOM User ID"
            value={mescomId}
            onChangeText={setMescomId}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#1a365d',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});