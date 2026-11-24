import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { fetchMESCOMData } from '../data/mescomService';

const getErrorMessage = (error) =>
  error instanceof Error ? error.message : 'Unable to load MESCOM data.';

export default function DashboardScreen({ navigation, route }) {
  const userId = route.params?.userId;
  const category = route.params?.category;
  const ownerName = route.params?.ownerName;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchMESCOMData(userId, category, ownerName);
        if (isActive) {
          setData(result);
        }
      } catch (requestError) {
        if (isActive) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      isActive = false;
    };
  }, [category, ownerName, userId]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const result = await fetchMESCOMData(userId, category, ownerName);
      setData(result);
      setError(null);
      Alert.alert('Updated', 'Your simulated MESCOM data has been refreshed.');
    } catch (requestError) {
      Alert.alert('Refresh failed', getErrorMessage(requestError));
    } finally {
      setRefreshing(false);
    }
  };

  const logOut = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'CategoryScreen' }],
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color="#16a8bb" size="large" />
          <Text style={styles.loadingText}>Fetching live MESCOM server data...</Text>
          <Text style={styles.loadingHint}>This demo uses simulated account data</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>We couldn't load this account</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <PrimaryButton label="Back to sign in" onPress={logOut} />
        </View>
      </SafeAreaView>
    );
  }

  const maxUnits = Math.max(...data.history.map((item) => item.kWh), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topKicker}>LOCALUNIT</Text>
            <Text style={styles.topTitle}>Energy overview</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={logOut}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(data.ownerName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.ownerName}>{data.ownerName}</Text>
            <Text style={styles.accountId}>Account ID · {userId}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        </View>

        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeText}>
            Sample data only · Not connected to MESCOM
          </Text>
        </View>

        <Text style={styles.sectionLabel}>THIS MONTH</Text>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.unitsCard]}>
            <Text style={styles.cardEyebrow}>CURRENT MONTH UNITS USED</Text>
            <Text style={styles.unitsValue}>{data.currentUnits}</Text>
            <Text style={styles.unitsUnit}>kWh</Text>
            <View style={styles.cardAccent} />
          </View>
          <View style={[styles.summaryCard, styles.billCard]}>
            <Text style={styles.cardEyebrow}>PAYMENT DUE (ESTIMATE)</Text>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.billValue}>{data.currentBill.toLocaleString('en-IN')}</Text>
            <Text style={styles.billCaption}>Estimated bill</Text>
          </View>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeading}>
            <View>
              <Text style={styles.historyTitle}>Usage history</Text>
              <Text style={styles.historySubtitle}>Last 6 months · kWh</Text>
            </View>
            <View style={styles.historyIndicator}>
              <View style={styles.historyDot} />
              <Text style={styles.historyIndicatorText}>UNITS</Text>
            </View>
          </View>

          <View style={styles.chart}>
            {data.history.map((item) => {
              const height = Math.max(12, Math.round((item.kWh / maxUnits) * 112));
              return (
                <View key={`${item.month}-${item.kWh}`} style={styles.chartColumn}>
                  <Text style={styles.chartValue}>{item.kWh}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height }]} />
                  </View>
                  <Text style={styles.monthLabel}>{item.month}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.historyDivider} />
          <View style={styles.historyFooter}>
            <Text style={styles.historyFooterLabel}>Latest estimated bill</Text>
            <Text style={styles.historyFooterAmount}>
              ₹{data.history[data.history.length - 1].billAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <PrimaryButton
          label="Refresh Live Data"
          loading={refreshing}
          onPress={refreshData}
          style={styles.refreshButton}
        />
        <Text style={styles.footerNote}>
          Usage and bill figures are generated for demonstration.
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  topKicker: {
    color: '#16849d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  topTitle: {
    marginTop: 4,
    color: '#0a2347',
    fontSize: 23,
    fontWeight: '800',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#dce6f0',
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  logoutText: {
    color: '#365775',
    fontSize: 12,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#0a2347',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#1e486e',
  },
  avatarText: {
    color: '#53d9e3',
    fontSize: 20,
    fontWeight: '800',
  },
  profileCopy: {
    flex: 1,
    marginLeft: 12,
  },
  ownerName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  accountId: {
    marginTop: 5,
    color: '#bdcde0',
    fontSize: 11,
  },
  categoryBadge: {
    marginLeft: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#d9f6f7',
  },
  categoryText: {
    color: '#126b81',
    fontSize: 10,
    fontWeight: '800',
  },
  demoNotice: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 22,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff3d8',
  },
  demoNoticeText: {
    color: '#805d1c',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionLabel: {
    marginBottom: 10,
    color: '#74879b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    minHeight: 150,
    flex: 1,
    padding: 16,
    overflow: 'hidden',
    borderRadius: 20,
  },
  unitsCard: {
    backgroundColor: '#103762',
  },
  billCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5edf5',
  },
  cardEyebrow: {
    color: '#b7c9dc',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  unitsValue: {
    marginTop: 19,
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  unitsUnit: {
    marginTop: -2,
    color: '#b8ccdf',
    fontSize: 12,
  },
  cardAccent: {
    position: 'absolute',
    right: -17,
    bottom: -27,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#1a527a',
  },
  currency: {
    marginTop: 18,
    color: '#16849d',
    fontSize: 14,
    fontWeight: '700',
  },
  billValue: {
    marginTop: 1,
    color: '#0a2347',
    fontSize: 27,
    fontWeight: '800',
  },
  billCaption: {
    marginTop: 7,
    color: '#71849a',
    fontSize: 11,
  },
  historyCard: {
    marginTop: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5edf5',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  historyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    color: '#102d4f',
    fontSize: 17,
    fontWeight: '800',
  },
  historySubtitle: {
    marginTop: 5,
    color: '#8091a4',
    fontSize: 11,
  },
  historyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    borderRadius: 4,
    backgroundColor: '#1ebbc9',
  },
  historyIndicatorText: {
    color: '#668097',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  chart: {
    height: 170,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartValue: {
    marginBottom: 6,
    color: '#70849a',
    fontSize: 9,
  },
  barTrack: {
    width: 22,
    height: 116,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: '#edf4f8',
  },
  barFill: {
    width: '100%',
    borderRadius: 9,
    backgroundColor: '#20becf',
  },
  monthLabel: {
    marginTop: 8,
    color: '#71849a',
    fontSize: 10,
    fontWeight: '600',
  },
  historyDivider: {
    height: 1,
    marginTop: 17,
    backgroundColor: '#edf1f5',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 13,
  },
  historyFooterLabel: {
    color: '#71849a',
    fontSize: 11,
  },
  historyFooterAmount: {
    color: '#102d4f',
    fontSize: 12,
    fontWeight: '800',
  },
  refreshButton: {
    marginTop: 18,
    backgroundColor: '#117f9c',
  },
  footerNote: {
    marginTop: 12,
    color: '#8a9aab',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 17,
    color: '#173a5d',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingHint: {
    marginTop: 8,
    color: '#8091a4',
    fontSize: 12,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#0a2347',
    fontSize: 23,
    fontWeight: '800',
  },
  errorMessage: {
    marginTop: 10,
    marginBottom: 24,
    color: '#6f8298',
    fontSize: 14,
    lineHeight: 21,
  },
});
