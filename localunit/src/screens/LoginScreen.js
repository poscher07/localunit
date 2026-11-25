import React, { useContext, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { CredentialContext } from '../context/CredentialContext';
import { getEscomDivision } from '../data/escomDivisions';
import { EscomApiError, fetchLiveBill } from '../data/escomApi';

async function openPortal(url) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open portal', 'Check that a browser is available on this device.');
  }
}

export default function LoginScreen({ navigation, route }) {
  const category = route.params?.category;
  const divisionCode = route.params?.divisionCode;
  const division = getEscomDivision(divisionCode);
  const { setCredentials } = useContext(CredentialContext);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const changeDivision = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'DivisionScreen' }],
    });
  };

  const handleLogin = async () => {
    const normalizedUserId = userId.trim();
    if (!category || !division) {
      Alert.alert('Choose your service', 'Select an ESCOM division and account category first.');
      return;
    }
    if (!normalizedUserId || !password) {
      Alert.alert('Missing details', `Enter your ${division.code} User ID and password.`);
      return;
    }

    const loginCredentials = {
      escom: division.code,
      category,
      userId: normalizedUserId,
      password,
    };

    setIsLoggingIn(true);
    setError('');
    try {
      const result = await fetchLiveBill(loginCredentials);
      setCredentials({ ...loginCredentials, userId: normalizedUserId });
      navigation.replace('DashboardScreen', { bill: result });
    } catch (requestError) {
      if (
        requestError instanceof EscomApiError &&
        requestError.status === 401 &&
        requestError.code === 'UNREGISTERED_OR_INVALID'
      ) {
        Alert.alert(
          'Account not connected',
          requestError.message,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Register in Chrome', onPress: () => void openPortal(division.registerUrl) },
          ],
        );
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The LocalUnit bill service could not be reached.',
      );
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
          <DivisionHeader
            category={category}
            division={division}
            onChangeDivision={changeDivision}
          />
          <View style={styles.heading}>
            <Text style={styles.kicker}>LIVE ESCOM CONNECTION</Text>
            <Text style={styles.title}>Connect your{'\n'}electricity account</Text>
            <Text style={styles.description}>
              Your credentials are used for this request only and are not saved on this device.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>ESCOM User ID</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setUserId}
              placeholder="Enter your official portal User ID"
              placeholderTextColor="#9aabbd"
              style={styles.input}
              value={userId}
            />
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Password</Text>
              <Text onPress={() => setShowPassword((visible) => !visible)} style={styles.showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </View>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              placeholder="Official portal password"
              placeholderTextColor="#9aabbd"
              returnKeyType="go"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
            />

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
            <PrimaryButton
              label="Connect & Fetch Live Bill"
              loading={isLoggingIn}
              onPress={handleLogin}
              style={styles.loginButton}
            />
            {isLoggingIn ? (
              <Text style={styles.loadingText}>
                Authenticating with official {division?.code} server...
              </Text>
            ) : null}
          </View>

          <Text style={styles.registerPrompt}>
            No {division?.code} Account Yet?
          </Text>
          <PrimaryButton
            label="Register on Official Portal"
            onPress={() => void openPortal(division?.registerUrl)}
            style={styles.registerButton}
          />
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
  heading: {
    marginTop: 28,
    marginBottom: 22,
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
    fontSize: 33,
    fontWeight: '800',
    lineHeight: 40,
  },
  description: {
    marginTop: 10,
    color: '#647a93',
    fontSize: 13,
    lineHeight: 19,
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
  loadingText: {
    marginTop: 12,
    color: '#365775',
    fontSize: 12,
    textAlign: 'center',
  },
  errorBanner: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff0ed',
    color: '#a43e2d',
    fontSize: 12,
    lineHeight: 18,
  },
  registerPrompt: {
    marginTop: 24,
    color: '#365775',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 10,
    backgroundColor: '#147f9c',
  },
});
