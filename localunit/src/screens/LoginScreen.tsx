import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function LoginScreen({ route, navigation }: any) {
  const { category } = route.params;
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useFocusEffect(
    useEffect(() => {
      const loadUsers = async () => {
        const stored = await AsyncStorage.getItem('users');
        if (stored) {
          setUsers(JSON.parse(stored));
        }
      };
      loadUsers();
    }, [])
  );

  const handleLogin = async () => {
    setIsLoggingIn(true);
    
    // Demo login
    if (userId === 'demo123' && password === '1234') {
      Alert.alert('Success', 'Welcome to LocalUnit!');
      navigation.navigate('DashboardScreen');
      setIsLoggingIn(false);
      return;
    }

    // Check stored users
    const user = users.find(
      (u: any) => u.userId === userId && u.password === password
    );

    if (user) {
      Alert.alert('Success', `Welcome, ${user.name}!`);
      navigation.navigate('DashboardScreen');
    } else {
      Alert.alert('Error', 'Invalid User ID or Password');
    }
    setIsLoggingIn(false);
  };

  const renderUser = (user: any) => (
    <View style={styles.userItem}>
      <Text style={styles.userId}>{user.userId}</Text>
      <Text style={styles.password}>{user.password}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Login</Text>
        {category && <Text style={styles.badge}>Category: {category}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          placeholder="MESCOM User ID"
          value={userId}
          onChangeText={setUserId}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
        />
        <TouchableOpacity style={styles.toggle} onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleText}>
            {showPassword ? 'Hide' : 'Show'} password
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoggingIn}>
        {isLoggingIn ? (
          <Text style={styles.loginButtonText}>Logging in...</Text>
        ) : (
          <Text style={styles.loginButtonText}>Login</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.noAccount}>
        No account created in MESCOM yet?{' '}
        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('RegisterScreen')}>
          <Text style={styles.registerText}>Register here</Text>
        </TouchableOpacity>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  badge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a365d',
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  toggle: {
    marginTop: 5,
  },
  toggleText: {
    color: '#1a365d',
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#1a365d',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noAccount: {
    marginTop: 10,
  },
  registerLink: {
    color: '#1a365d',
    fontSize: 14,
    fontWeight: '600',
  },
  registerText: {
    color: '#1a365d',
  },
  userItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  userId: {
    fontSize: 12,
    color: '#666',
  },
  password: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
});