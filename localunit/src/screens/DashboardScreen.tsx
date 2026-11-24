import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMESCOMData } from '../data/mescomService';

export default function DashboardScreen({ route, navigation }: any) {
  const { category, userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchMESCOMData(userId, category);
        setData(result);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
      setLoading(false);
    };

    const timer = setTimeout(() => {
      loadData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [userId, category]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const result = await fetchMESCOMData(userId, category);
      setData(result);
      Alert.alert('Success', 'Live data refreshed successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setRefreshing(false);
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          <ActivityIndicator size="large" color="#1a365d" />
          <Text style={styles.loadingText}>Fetching live MESCOM server data...</Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.goBack()}>
            {/* Icon placeholder */}
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{data.name}</Text>
          <Text style={styles.accountId}>Account ID: {userId}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Month Units Used</Text>
            <Text style={styles.cardValue}>{data.currentUnits} kWh</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Official Payment Due</Text>
            <Text style={styles.cardValue}>₹{data.currentBill}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Usage History</Text>
          <View style={styles.barChart}>
            {data.history.map((item, index) => (
              <View key={item.month} style={styles.bar} />
            ))}
          </View>
          <Text style={styles.chartLabel}>Previous 6 Months</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <Text style={styles.refreshText}>
            {refreshing ? 'Refreshing...' : 'Refresh Live Data'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  logoutButton: {
    padding: 8,
  },
  userInfo: {
    marginVertical: 20,
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: 5,
  },
  accountId: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a365d',
  },
  cardsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: 15,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  bar: {
    width: 30,
    marginHorizontal: 4,
    minHeight: 20,
  },
  chartLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    fontSize: 12,
    color: '#64748b',
  },
  refreshButton: {
    width: '100%',
    backgroundColor: '#1a365d',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 15,
    color: '#1a365d',
    fontSize: 16,
  },
});