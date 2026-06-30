/**
 * Example app demonstrating @iconifybeyond/react-native-android-credentials
 *
 * NOTE: Before running, replace the placeholder values:
 *   - GOOGLE_SERVER_CLIENT_ID: Your Google OAuth2 server client ID
 *   - passkeyRequestJson: A valid PublicKeyCredentialCreationOptions JSON from your server
 *
 * This app requires Android and the New Architecture enabled.
 */

import React, { useState } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createPasswordCredential,
  savePasskey,
  getCredential,
  signInWithGoogle,
  clearCredentialState,
  CredentialError,
} from '@iconifybeyond/react-native-android-credentials';

// ⚠️  Replace with your actual Google OAuth2 server client ID
const GOOGLE_SERVER_CLIENT_ID =
  'YOUR_GOOGLE_SERVER_CLIENT_ID.apps.googleusercontent.com';

// ⚠️  Replace with a valid challenge from your WebAuthn server
const PASSKEY_CREATE_REQUEST_JSON = JSON.stringify({
  challenge: 'REPLACE_WITH_BASE64URL_CHALLENGE',
  rp: { id: 'example.com', name: 'Example App' },
  user: {
    id: 'REPLACE_WITH_BASE64URL_USER_ID',
    name: 'user@example.com',
    displayName: 'Example User',
  },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
  timeout: 60000,
  attestation: 'none',
});

const PASSKEY_GET_REQUEST_JSON = JSON.stringify({
  challenge: 'REPLACE_WITH_BASE64URL_CHALLENGE',
  timeout: 60000,
  rpId: 'example.com',
  allowCredentials: [],
  userVerification: 'required',
});

export default function App() {
  const [username, setUsername] = useState('user@example.com');
  const [password, setPassword] = useState('mySecurePassword123');
  const [result, setResult] = useState<string>('Results will appear here…');

  const wrap = async (fn: () => Promise<unknown>, label: string) => {
    setResult(`${label}: running…`);
    try {
      const res = await fn();
      setResult(
        `${label}: success\n\n${res !== undefined && res !== null ? JSON.stringify(res, null, 2) : '(no data)'}`
      );
    } catch (err) {
      if (err instanceof CredentialError) {
        setResult(
          `${label}: CredentialError\ncode: ${err.code}\nmessage: ${err.message}`
        );
      } else {
        setResult(`${label}: unexpected error\n${String(err)}`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Android Credentials Example</Text>
        <Text style={styles.subtitle}>
          @iconifybeyond/react-native-android-credentials
        </Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.buttonRow}>
          <Button
            title="Save Password"
            onPress={() =>
              wrap(
                () => createPasswordCredential(username, password),
                'createPasswordCredential'
              )
            }
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Create Passkey"
            onPress={() =>
              wrap(
                () => savePasskey(PASSKEY_CREATE_REQUEST_JSON),
                'savePasskey'
              )
            }
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Sign In (unified)"
            onPress={() =>
              wrap(
                () =>
                  getCredential({
                    password: true,
                    passkey: true,
                    google: true,
                    passkeyRequestJson: PASSKEY_GET_REQUEST_JSON,
                    googleServerClientId: GOOGLE_SERVER_CLIENT_ID,
                    autoSelectEnabled: false,
                  }),
                'getCredential'
              )
            }
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Sign In with Google"
            onPress={() =>
              wrap(
                () =>
                  signInWithGoogle({
                    serverClientId: GOOGLE_SERVER_CLIENT_ID,
                    autoSelectEnabled: false,
                    filterByAuthorizedAccounts: false,
                  }),
                'signInWithGoogle'
              )
            }
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Clear Credential State"
            color="#cc3333"
            onPress={() =>
              wrap(() => clearCredentialState(), 'clearCredentialState')
            }
          />
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#888', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 4,
    fontSize: 14,
  },
  buttonRow: { marginVertical: 6 },
  resultBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minHeight: 100,
  },
  resultText: { fontFamily: 'monospace', fontSize: 12, color: '#333' },
});
