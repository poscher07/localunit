import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrimaryButton from '../components/PrimaryButton';

const errorMessage = (error) =>
  error instanceof Error ? error.message : 'Please try again.';

export default function LoginScreen({ navigation, route }) {
  const category = route.params?.category;
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const openDashboard = (accountId, ownerName) => {
    navigation.replace('DashboardScreen', {
      userId: accountId,
      category,
      ownerName,
    });
  };

  const handleLogin = async () => {
    const normalizedUserId = userId.trim();
    if (!category) {
      Alert.alert('Choose a category', 'Go back and select Domestic or Commercial.');
      return;
    }
    if (!normalizedUserId || !password) {
      Alert.alert('Missing details', 'Enter your MESCOM User ID and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      if (normalizedUserId === 'demo123' && password === '1234') {
        openDashboard('demo123');
        return;
      }

      const savedAccounts = await AsyncStorage.getItem('users');
      const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
      if (!Array.isArray(accounts)) {
        throw new Error('Saved account data is invalid. Please register again.');
      }

      const account = accounts.find(
        (savedAccount) =>
          savedAccount.userId?.toLowerCase() === normalizedUserId.toLowerCase() &&
          savedAccount.password === password,
      );

      if (!account) {
        Alert.alert('Login failed', 'Check your User ID and password, then try again.');
        return;
      }
      if (account.category && account.category !== category) {
        Alert.alert(
          'Category mismatch',
          `This account was registered as ${account.category}. Select that category to continue.`,
        );
        return;
      }

      openDashboard(account.userId, account.fullName);
    } catch (error) {
      Alert.alert('Could not sign in', errorMessage(error));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹  Change category</Text>
          </Pressable>

          <View style={styles.heading}>
            <Text style={styles.kicker}>WELCOME BACK</Text>
            <Text style={styles.title}>Sign in to{'\n'}LocalUnit</Text>
            <View style={styles.categoryBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.categoryText}>{category || 'No category selected'}</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>MESCOM User ID</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setUserId}
              placeholder="Enter your account ID"
              placeholderTextColor="#9aabbd"
              style={styles.input}
              value={userId}
            />

            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Password</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPassword((visible) => !visible)}
              >
                <Text style={styles.showPassword}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              placeholder="Enter your password"
              placeholderTextColor="#9aabbd"
              returnKeyType="go"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
            />

            <PrimaryButton
              label="Login"
              loading={isLoggingIn}
              onPress={handleLogin}
              style={styles.loginButton}
            />

            <Text style={styles.demoHint}>
              Demo: User ID <Text style={styles.demoStrong}>demo123</Text>
              {'  '}Password <Text style={styles.demoStrong}>1234</Text>
            </Text>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>No account created in MESCOM yet?</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('RegisterScreen', { category })}
            >
              <Text style={styles.registerLink}>Register here</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f7fc',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingRight: 12,
  },
  backText: {
    color: '#426587',
    fontSize: 14,
    fontWeight: '600',
  },
  heading: {
    marginTop: 20,
    marginBottom: 28,
  },
  kicker: {
    color: '#16849d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 10,
    color: '#0a2347',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e1f4f7',
  },
  badgeDot: {
    width: 7,
    height: 7,
    marginRight: 7,
    borderRadius: 4,
    backgroundColor: '#10aabd',
  },
  categoryText: {
    color: '#126b81',
    fontSize: 12,
    fontWeight: '700',
  },
  form: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5edf5',
    borderRadius: 22,
    backgroundColor: '#ffffff',
  },
  label: {
    marginBottom: 9,
    color: '#274563',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    height: 54,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#dce6f0',
    borderRadius: 14,
    backgroundColor: '#fbfdff',
    color: '#102d4f',
    fontSize: 15,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  showPassword: {
    color: '#16849d',
    fontSize: 13,
    fontWeight: '700',
  },
  loginButton: {
    marginTop: 2,
  },
  demoHint: {
    marginTop: 15,
    color: '#71849a',
    fontSize: 12,
    textAlign: 'center',
  },
  demoStrong: {
    color: '#315b7d',
    fontWeight: '700',
  },
  registerRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerPrompt: {
    color: '#70849a',
    fontSize: 13,
  },
  registerLink: {
    marginTop: 8,
    color: '#087e9d',
    fontSize: 14,
    fontWeight: '800',
  },
});
