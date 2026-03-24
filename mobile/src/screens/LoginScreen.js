import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';

import { authAPI } from '../api/auth.api';

export default function LoginScreen({ navigation }) {

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      if (!phone || !password) {
        Alert.alert('Error', 'Enter all fields');
        return;
      }

      const user = await authAPI.login(phone, password);

      if (user) {
        navigation.replace('Dashboard');
      }

    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert('Login Failed', 'Check credentials or backend');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>HeyMate</Text>

      <TextInput
        placeholder="Phone"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      {/* ❗ FIXED: Remove Register Navigation (no screen exists) */}
      <TouchableOpacity>
        <Text style={{ color: 'orange', marginTop: 20 }}>
          Register feature coming soon
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0D0D1A'
  },
  title: {
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30
  },
  input: {
    backgroundColor: '#222',
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
    color: 'white'
  },
  button: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 8,
    marginTop: 10
  },
  btnText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold'
  }
});