import React, { useContext, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CredentialContext } from '../context/CredentialContext';
import { getEscomDivision } from '../data/escomDivisions';

const PORTALS = {
  MESCOM: {
    url: 'https://mescom.org.in/mescom/auth/signin',
    hosts: ['mescom.org.in'],
  },
  HESCOM: {
    url: 'https://hescom.co.in/hescom/auth/signin',
    hosts: ['hescom.co.in'],
  },
  GESCOM: {
    url: 'https://gescomglb.org/',
    hosts: ['gescomglb.org'],
  },
};

function createInjectedScript(userId, password, selectedEscom) {
  const credentials = JSON.stringify({ userId, password });
  const hosts = JSON.stringify(PORTALS[selectedEscom].hosts);

  return `(function () {
    var credentials = ${credentials};
    var allowedHosts = ${hosts};
    var hostname = window.location.hostname.toLowerCase();
    if (!allowedHosts.some(function (host) {
      return hostname === host || hostname.endsWith('.' + host);
    })) {
      return true;
    }

    function normalize(value) {
      return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function visible(element) {
      return element && element.getBoundingClientRect().width > 0;
    }

    function prefillCredentials() {
      var path = window.location.pathname;
      var isLoginPage = /signin|login/i.test(path) ||
        (${JSON.stringify(selectedEscom)} === 'GESCOM' && path === '/');
      if (!isLoginPage) return false;

      var inputs = Array.prototype.slice.call(
        document.querySelectorAll('input:not([type]), input[type="text"], input[type="email"]')
      ).filter(function (input) {
        var attributes = [input.name, input.id, input.placeholder, input.autocomplete].join(' ');
        return visible(input) && !/captcha|otp|search|token|verification/i.test(attributes);
      });
      var userInput = document.querySelector('input[autocomplete="username"]') ||
        inputs.find(function (input) {
          return /user|login|account|consumer|rr|userid/i.test(
            [input.name, input.id, input.placeholder, input.autocomplete].join(' ')
          );
        }) || inputs[0];
      var passwordInput = Array.prototype.slice.call(
        document.querySelectorAll('input[type="password"]')
      ).find(visible);

      function setValue(input, value) {
        if (!input || input.value) return;
        var setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      setValue(userInput, credentials.userId);
      setValue(passwordInput, credentials.password);
      return Boolean(userInput && passwordInput);
    }

    var aliases = {
      ownerName: ['ownername', 'consumername', 'registeredname', 'nameofowner'],
      accountId: ['accountid', 'accountnumber', 'accountrrnumber', 'rrnumber', 'rrno', 'consumernumber'],
      unitsConsumed: ['unitsconsumed', 'currentmonthunits', 'totalunits', 'energyconsumed', 'unitskwh', 'units', 'kwh'],
      amountDue: ['netpayable', 'amountdue', 'totalpayable', 'amountpayable', 'billamount', 'netamount'],
      dueDate: ['duedate', 'paymentduedate', 'lastdateofpayment'],
      billMonth: ['billmonth', 'billingmonth', 'billingcycle', 'billingperiod']
    };

    function findField(label) {
      var normalized = normalize(label);
      return Object.keys(aliases).find(function (candidate) {
        return aliases[candidate].some(function (alias) {
          return normalized === alias || normalized.indexOf(alias) === 0;
        });
      });
    }

    function numeric(value) {
      var match = String(value || '').replace(/,/g, '').match(/-?\\d+(?:\\.\\d+)?/);
      return match ? Number(match[0]) : null;
    }

    function extractBill() {
      var values = {};
      function capture(label, value) {
        var key = findField(label);
        var text = String(value || '').trim().replace(/\\s+/g, ' ');
        var valueIsLabel = Boolean(findField(text));
        if (key && text && !valueIsLabel && !values[key]) values[key] = text;
      }

      Array.prototype.forEach.call(document.querySelectorAll('table tr'), function (row) {
        var cells = Array.prototype.slice.call(row.querySelectorAll('th, td'));
        for (var index = 0; index < cells.length - 1; index += 1) {
          capture(cells[index].innerText, cells[index + 1].innerText);
        }
      });

      Array.prototype.forEach.call(document.querySelectorAll('table'), function (table) {
        var rows = Array.prototype.slice.call(table.querySelectorAll('tr'));
        if (rows.length < 2) return;
        var headings = Array.prototype.slice.call(rows[0].querySelectorAll('th, td'));
        rows.slice(1).forEach(function (row) {
          var cells = Array.prototype.slice.call(row.querySelectorAll('th, td'));
          headings.forEach(function (heading, index) {
            if (cells[index]) capture(heading.innerText, cells[index].innerText);
          });
        });
      });

      Array.prototype.forEach.call(document.querySelectorAll('label'), function (label) {
        var target = label.htmlFor && document.getElementById(label.htmlFor);
        capture(label.innerText, target ? (target.value || target.innerText) : label.nextElementSibling && label.nextElementSibling.innerText);
      });

      String(document.body ? document.body.innerText : '').split(/\\r?\\n/).forEach(function (line) {
        var separator = line.indexOf(':');
        if (separator > 0) capture(line.slice(0, separator), line.slice(separator + 1));
      });

      var units = numeric(values.unitsConsumed);
      var amount = numeric(values.amountDue);
      if (!values.ownerName || !values.accountId || units === null || amount === null || !values.dueDate) {
        return null;
      }
      return {
        ownerName: values.ownerName,
        accountId: values.accountId,
        unitsConsumed: units,
        amountDue: amount,
        dueDate: values.dueDate,
        billMonth: values.billMonth || 'Current',
        history: []
      };
    }

    var lastSent = '';
    function observe(manual) {
      var bill = extractBill();
      if (!bill) {
        if (manual) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'not_found' }));
        return;
      }
      var serialized = JSON.stringify(bill);
      if (serialized !== lastSent) {
        lastSent = serialized;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'bill', bill: bill }));
      }
    }

    window.__localUnitExtractBill = function () { observe(true); };
    if (document.documentElement) {
      var observerTimer;
      new MutationObserver(function () {
        window.clearTimeout(observerTimer);
        observerTimer = window.setTimeout(function () { observe(false); }, 400);
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    observe(false);

    var attempts = 0;
    var fillTimer = window.setInterval(function () {
      attempts += 1;
      if (prefillCredentials() || attempts >= 20) window.clearInterval(fillTimer);
    }, 500);
    prefillCredentials();
    return true;
  })();
  true;`;
}

export default function PortalBridgeScreen({ navigation, route }) {
  const { setCredentials } = useContext(CredentialContext);
  const webViewRef = useRef(null);
  const hasNavigatedRef = useRef(false);
  const { selectedEscom, category, userId, password } = route.params || {};
  const portal = PORTALS[selectedEscom];
  const division = getEscomDivision(selectedEscom);
  const [error, setError] = useState('');
  const injectedJavaScript = useMemo(
    () => (portal ? createInjectedScript(userId, password, selectedEscom) : ''),
    [password, portal, selectedEscom, userId],
  );

  const handleMessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      setError('The official portal returned bill data in an unsupported format.');
      return;
    }

    if (message.type === 'not_found') {
      setError('Bill details are not visible yet. Sign in, open your bill, then try again.');
      return;
    }
    if (message.type !== 'bill' || !message.bill || hasNavigatedRef.current) {
      return;
    }

    const extractedBill = message.bill;
    if (
      typeof extractedBill.ownerName !== 'string' ||
      typeof extractedBill.accountId !== 'string' ||
      typeof extractedBill.dueDate !== 'string' ||
      !Number.isFinite(extractedBill.unitsConsumed) ||
      !Number.isFinite(extractedBill.amountDue)
    ) {
      setError('The official portal returned incomplete bill details. Try extracting the bill again.');
      return;
    }

    hasNavigatedRef.current = true;
    const bill = {
      ownerName: extractedBill.ownerName,
      accountId: extractedBill.accountId,
      unitsConsumed: extractedBill.unitsConsumed,
      amountDue: extractedBill.amountDue,
      dueDate: extractedBill.dueDate,
      billMonth: typeof extractedBill.billMonth === 'string' ? extractedBill.billMonth : 'Current',
      history: [],
      escom: { code: selectedEscom, name: division?.name || selectedEscom },
      category,
      lastSynced: new Date().toISOString(),
    };
    setCredentials({ escom: selectedEscom, category, userId, password });
    navigation.replace('DashboardScreen', { bill });
  };

  const isAllowedPortal = (url) => {
    if (!portal) return false;
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return portal.hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  };

  if (!portal || !category || !userId || !password) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Portal sign-in details are missing. Return and try again.</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.retryButton}>
            <Text style={styles.retryText}>Back to sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            Official {selectedEscom} Portal — Enter CAPTCHA &amp; Sign In to sync your bill automatically
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => webViewRef.current?.injectJavaScript(
            'window.__localUnitExtractBill && window.__localUnitExtractBill(); true;',
          )}
          style={styles.extractButton}
        >
          <Text style={styles.extractButtonText}>Extract Bill Now</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      <WebView
        ref={webViewRef}
        source={{ uri: portal.url }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onError={() => setError('Could not load the official portal. Check your connection and try again.')}
        onShouldStartLoadWithRequest={(request) => isAllowedPortal(request.url)}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        startInLoadingState
        style={styles.webView}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f7fc',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  banner: {
    marginBottom: 10,
  },
  bannerTitle: {
    color: '#0a2347',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  extractButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#117f9c',
  },
  extractButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBanner: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#fff0ed',
    color: '#a43e2d',
    fontSize: 12,
  },
  webView: {
    flex: 1,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#a43e2d',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 18,
    padding: 12,
  },
  retryText: {
    color: '#117f9c',
    fontSize: 14,
    fontWeight: '700',
  },
});
