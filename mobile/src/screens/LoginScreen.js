import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import { authAPI } from '../api/auth.api';

export default function LoginScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password || (!phone && !email)) {
      alert('Enter phone/email and password');
      return;
    }

    try {
      setLoading(true);

      const user = await authAPI.loginWithCredentials({
        phone,
        email,
        password,
      });

      dispatch(setUser(user));

      // 🚀 Navigate to Dashboard
      navigation.replace('Dashboard');

    } catch (error) {
      console.log(error);
      alert('Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>HeyMate</Text>
      <Text style={styles.subtitle}>One App • Any Task • Any Time</Text>

      {/* Phone */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter phone"
        placeholderTextColor="#aaa"
        value={phone}
        onChangeText={setPhone}
        keyboardType="numeric"
      />

      {/* Email */}
      <Text style={styles.label}>Email (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Register */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.register}>
          Don't have an account? Register Now
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0D0D1A',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: '#FF5722',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    color: '#fff',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1E1E2F',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  register: {
    color: '#FF5722',
    textAlign: 'center',
    marginTop: 20,
  },
});