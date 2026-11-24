import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import DivisionHeader from '../components/DivisionHeader';
import { getAccountsForDivision, saveAccountsForDivision } from '../data/accountStorage';
import { getEscomDivision } from '../data/escomDivisions';

const errorMessage = (error) =>
  error instanceof Error ? error.message : 'Please try again.';

export default function RegisterScreen({ navigation, route }) {
  const category = route.params?.category;
  const divisionCode = route.params?.divisionCode;
  const division = getEscomDivision(divisionCode);
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRegister = async () => {
    const name = fullName.trim();
    const accountId = userId.trim();
    if (!name || !accountId || !password) {
      Alert.alert(
        'Missing details',
        `Complete your name, ${division?.code || 'ESCOM'} User ID, and password.`,
      );
      return;
    }
    if (!category || !division) {
      Alert.alert('Choose your service', 'Select an ESCOM division and account category first.');
      return;
    }

    setSaving(true);
    try {
      const accounts = await getAccountsForDivision(division.code);

      const duplicate = accounts.some(
        (account) =>
          account.divisionCode === division.code &&
          account.userId?.toLowerCase() === accountId.toLowerCase(),
      );
      if (duplicate) {
        Alert.alert('Account already exists', 'Use your existing account or choose another ID.');
        return;
      }

      accounts.push({
        id: `${Date.now()}`,
        fullName: name,
        userId: accountId,
        password,
        category,
        divisionCode: division.code,
      });
      await saveAccountsForDivision(division.code, accounts);
      Alert.alert(
        'Account created',
        'Your account is saved on this device. You can now sign in.',
        [{
          text: 'Continue',
          onPress: () =>
            navigation.navigate('LoginScreen', { category, divisionCode }),
        }],
      );
    } catch (error) {
      Alert.alert('Could not create account', errorMessage(error));
    } finally {
      setSaving(false);
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
          <DivisionHeader
            category={category}
            division={division}
            onChangeDivision={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'DivisionScreen' }],
              })
            }
          />

          <Text style={styles.kicker}>GET STARTED</Text>
          <Text style={styles.title}>Create your{'\n'}LocalUnit account</Text>
          <Text style={styles.description}>
            Set up a local profile for your {division?.code || 'ESCOM'} connection.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setFullName}
              placeholder="Name on your connection"
              placeholderTextColor="#9aabbd"
              style={styles.input}
              value={fullName}
            />

            <Text style={styles.label}>{division?.code || 'ESCOM'} User ID</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setUserId}
              placeholder="Enter your account ID"
              placeholderTextColor="#9aabbd"
              style={styles.input}
              value={userId}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor="#9aabbd"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            <PrimaryButton
              label="Create account"
              loading={saving}
              onPress={handleRegister}
              style={styles.submitButton}
            />
          </View>
          <Text style={styles.localNotice}>
            This demo stores profile data only on this device.
          </Text>
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
  kicker: {
    color: '#16849d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 10,
    color: '#0a2347',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  description: {
    marginTop: 10,
    marginBottom: 22,
    color: '#71849a',
    fontSize: 14,
    lineHeight: 21,
  },
  form: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5edf5',
    borderRadius: 22,
    backgroundColor: '#ffffff',
  },
  label: {
    marginBottom: 8,
    color: '#274563',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    height: 52,
    marginBottom: 17,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#dce6f0',
    borderRadius: 14,
    backgroundColor: '#fbfdff',
    color: '#102d4f',
    fontSize: 15,
  },
  submitButton: {
    marginTop: 6,
  },
  localNotice: {
    marginTop: 18,
    color: '#8393a6',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
