import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { CredentialContext } from '../context/CredentialContext';
import { getEscomDivision } from '../data/escomDivisions';
import { fetchLiveBill } from '../data/escomApi';

const FREE_UNIT_LIMIT = 200;

function formatSyncedAt(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function DashboardScreen({ navigation, route }) {
  const { credentials, setCredentials } = useContext(CredentialContext);
  const division = getEscomDivision(credentials?.escom);
  const [data, setData] = useState(route.params?.bill || null);
  const [loading, setLoading] = useState(!route.params?.bill && Boolean(credentials));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(
    credentials ? '' : 'Reconnect your ESCOM account to fetch live bill data.',
  );

  const loadBill = async (isRefresh) => {
    if (!credentials) {
      setError('Reconnect your ESCOM account to fetch live bill data.');
      setLoading(false);
      return;
    }
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      setData(await fetchLiveBill(credentials));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The LocalUnit bill service could not be reached.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (data || !credentials) {
      return undefined;
    }

    let active = true;
    fetchLiveBill(credentials)
      .then((bill) => {
        if (active) {
          setData(bill);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'The LocalUnit bill service could not be reached.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [credentials, data]);

  const logOut = () => {
    setCredentials(null);
    navigation.reset({
      index: 0,
      routes: [{ name: 'DivisionScreen' }],
    });
  };

  const openPaymentPortal = async () => {
    try {
      await Linking.openURL(division.payUrl);
    } catch {
      Alert.alert('Could not open payment portal', 'Check that a browser is available on this device.');
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color="#16a8bb" size="large" />
          <Text style={styles.loadingText}>
            Fetching live {division?.code || 'ESCOM'} bill data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Live bill unavailable</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <PrimaryButton label="Try again" loading={refreshing} onPress={() => void loadBill(true)} />
          <Pressable onPress={logOut} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const units = Number(data.unitsConsumed);
  const history = Array.isArray(data.history) ? data.history : [];
  const maxUnits = Math.max(1, ...history.map((item) => Number(item.units) || 0));
  const freeUnitsRemaining = Math.max(0, FREE_UNIT_LIMIT - units);
  const progress = Math.min(1, Math.max(0, units / FREE_UNIT_LIMIT));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.heading}>
            <View style={styles.divisionBadge}>
              <Text style={styles.divisionBadgeText}>{data.escom.code} · {data.category}</Text>
            </View>
            <Text style={styles.topTitle}>Energy overview</Text>
            <Text style={styles.divisionName}>{data.escom.name}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={logOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{data.ownerName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.ownerName}>{data.ownerName}</Text>
            <Text style={styles.accountId}>Account ID · {data.accountId}</Text>
            <Text style={styles.categoryText}>{data.category}</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <Text style={styles.sectionLabel}>{data.billMonth} BILL</Text>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.unitsCard]}>
            <Text style={styles.cardEyebrow}>UNITS CONSUMED</Text>
            <Text style={styles.unitsValue}>{units}</Text>
            <Text style={styles.unitsUnit}>kWh</Text>
          </View>
          <View style={[styles.summaryCard, styles.billCard]}>
            <Text style={styles.cardEyebrowDark}>OFFICIAL AMOUNT DUE</Text>
            <Text style={styles.billValue}>₹{Number(data.amountDue).toLocaleString('en-IN')}</Text>
            <Text style={styles.billCaption}>Due {data.dueDate}</Text>
          </View>
        </View>

        {data.category === 'Domestic' ? (
          <View style={styles.gruhaCard}>
            <View style={styles.gruhaHeader}>
              <Text style={styles.gruhaTitle}>Gruha Jyothi tracker</Text>
              <Text style={styles.gruhaLimit}>200 kWh limit</Text>
            </View>
            <Text style={styles.gruhaValue}>{units} of {FREE_UNIT_LIMIT} kWh</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                    units > FREE_UNIT_LIMIT && styles.progressExceeded,
                  { width: `${Math.min(100, progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={[styles.gruhaNote, units > FREE_UNIT_LIMIT && styles.gruhaWarning]}>
              {units > FREE_UNIT_LIMIT
                ? `${(units - FREE_UNIT_LIMIT).toLocaleString('en-IN')} kWh above the 200-unit threshold`
                : `${freeUnitsRemaining.toLocaleString('en-IN')} free units remaining`}
            </Text>
            <Text style={styles.gruhaDisclaimer}>
              Consumption tracker only; eligibility and bill benefits are determined by the official scheme.
            </Text>
          </View>
        ) : null}

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Bill details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ESCOM division</Text>
            <Text style={styles.detailValue}>{data.escom.code} · {data.escom.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{data.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due date</Text>
            <Text style={styles.detailValue}>{data.dueDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last synced</Text>
            <Text style={styles.detailValue}>{formatSyncedAt(data.lastSynced)}</Text>
          </View>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Monthly usage history</Text>
          <Text style={styles.historySubtitle}>Official portal records · kWh</Text>
          {history.length ? (
            <View style={styles.chart}>
              {history.map((item, index) => {
                const itemUnits = Number(item.units);
                const height = Math.max(6, Math.round((itemUnits / maxUnits) * 112));
                return (
                  <View key={`${item.month}-${index}`} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{itemUnits}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height }]} />
                    </View>
                    <Text style={styles.monthLabel}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyHistory}>The official portal returned no past bill records.</Text>
          )}
        </View>

        <PrimaryButton
          label="Refresh Live Bill"
          loading={refreshing}
          onPress={() => void loadBill(true)}
          style={styles.refreshButton}
        />
        <PrimaryButton
          label="Pay Official Bill in Chrome"
          onPress={() => void openPaymentPortal()}
          style={styles.payButton}
        />
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heading: {
    flex: 1,
    marginRight: 10,
  },
  divisionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e1f4f7',
  },
  divisionBadgeText: {
    color: '#126b81',
    fontSize: 10,
    fontWeight: '800',
  },
  topTitle: {
    marginTop: 8,
    color: '#0a2347',
    fontSize: 23,
    fontWeight: '800',
  },
  divisionName: {
    marginTop: 5,
    color: '#365775',
    fontSize: 12,
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
  categoryText: {
    marginTop: 5,
    color: '#53d9e3',
    fontSize: 11,
    fontWeight: '700',
  },
  errorBanner: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff0ed',
    color: '#a43e2d',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionLabel: {
    marginTop: 22,
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
    minHeight: 140,
    flex: 1,
    padding: 16,
    borderRadius: 20,
  },
  unitsCard: {
    backgroundColor: '#103762',
  },
  billCard: {
    borderWidth: 1,
    borderColor: '#e5edf5',
    backgroundColor: '#ffffff',
  },
  cardEyebrow: {
    color: '#b7c9dc',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardEyebrowDark: {
    color: '#71849a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  unitsValue: {
    marginTop: 18,
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  unitsUnit: {
    color: '#b8ccdf',
    fontSize: 12,
  },
  billValue: {
    marginTop: 18,
    color: '#0a2347',
    fontSize: 24,
    fontWeight: '800',
  },
  billCaption: {
    marginTop: 7,
    color: '#71849a',
    fontSize: 11,
  },
  gruhaCard: {
    marginTop: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d8eee4',
    borderRadius: 20,
    backgroundColor: '#f1fbf6',
  },
  gruhaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gruhaTitle: {
    color: '#164e37',
    fontSize: 15,
    fontWeight: '800',
  },
  gruhaLimit: {
    color: '#287956',
    fontSize: 11,
    fontWeight: '700',
  },
  gruhaValue: {
    marginTop: 14,
    color: '#164e37',
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    marginTop: 10,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#dbece2',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#2a9d68',
  },
  progressExceeded: {
    backgroundColor: '#d24d43',
  },
  gruhaNote: {
    marginTop: 10,
    color: '#287956',
    fontSize: 12,
    fontWeight: '700',
  },
  gruhaWarning: {
    color: '#b33f35',
  },
  gruhaDisclaimer: {
    marginTop: 8,
    color: '#627f70',
    fontSize: 10,
    lineHeight: 15,
  },
  detailsCard: {
    marginTop: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5edf5',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  detailsTitle: {
    marginBottom: 10,
    color: '#102d4f',
    fontSize: 16,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#edf1f5',
  },
  detailLabel: {
    flex: 1,
    color: '#71849a',
    fontSize: 11,
  },
  detailValue: {
    flex: 1.2,
    color: '#274563',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  historyCard: {
    marginTop: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5edf5',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  historyTitle: {
    color: '#102d4f',
    fontSize: 16,
    fontWeight: '800',
  },
  historySubtitle: {
    marginTop: 5,
    color: '#8091a4',
    fontSize: 11,
  },
  chart: {
    height: 160,
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
  emptyHistory: {
    marginTop: 18,
    color: '#71849a',
    fontSize: 12,
    lineHeight: 18,
  },
  refreshButton: {
    marginTop: 18,
    backgroundColor: '#117f9c',
  },
  payButton: {
    marginTop: 10,
    backgroundColor: '#123b72',
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
  backButton: {
    alignSelf: 'center',
    marginTop: 14,
    padding: 12,
  },
  backButtonText: {
    color: '#365775',
    fontSize: 13,
    fontWeight: '700',
  },
});
