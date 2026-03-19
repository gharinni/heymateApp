import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import { useAppTheme } from '../context/AppThemeContext';

const BACKEND = 'https://heymateapp-production.up.railway.app/api'; // ✅ FIXED URL

const saveStorage = async (key, value) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(key, value);
    }
  } catch {}
};

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { colors: c } = useAppTheme();

  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', role: 'USER',
  });

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (mode === 'login') {
      if (!form.phone.trim() && !form.email.trim()) {
        Alert.alert('Error', 'Enter phone or email'); return;
      }
      if (!form.password.trim()) {
        Alert.alert('Error', 'Enter password'); return;
      }
    } else {
      if (!form.name.trim()) {
        Alert.alert('Error', 'Enter full name'); return;
      }
      if (form.phone.trim().length !== 10) {
        Alert.alert('Error', 'Enter valid phone number'); return;
      }
      if (form.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters'); return;
      }
    }

    setLoading(true);

    try {
      const url = mode === 'login'
        ? `${BACKEND}/auth/login`
        : `${BACKEND}/auth/register`;

      const body = mode === 'login'
        ? (form.phone.trim()
            ? { phone: form.phone.trim(), password: form.password }
            : { email: form.email.trim().toLowerCase(), password: form.password })
        : {
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            role: form.role,
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data); // ✅ DEBUG

      if (data?.token || data?.data?.token) {

        const userData = data.token ? data : data.data;

        userData.role = (userData.role || 'USER').toUpperCase();

        await saveStorage('token', userData.token);
        await saveStorage('user', JSON.stringify(userData));

        dispatch(setUser(userData));

        // ✅ MAIN FIX: NAVIGATION
        navigation.replace('Dashboard');

      } else {
        Alert.alert(
          mode === 'login' ? 'Login Failed' : 'Registration Failed',
          data?.message || 'Something went wrong'
        );
      }

    } catch (e) {
      Alert.alert('Error', 'Server not reachable');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 60 }}
    >

      <View style={{ alignItems: 'center', marginBottom: 36 }}>
        <Text style={{ fontSize: 52 }}>⚡</Text>
        <Text style={{ fontSize: 34, fontWeight: '800', color: c.primary }}>
          HeyMate
        </Text>
      </View>

      {/* Toggle */}
      <View style={{
        flexDirection: 'row', backgroundColor: c.card,
        borderRadius: 16, padding: 4, marginBottom: 24,
      }}>
        {['login', 'signup'].map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={{
              flex: 1, padding: 12,
              backgroundColor: mode === m ? c.primary : 'transparent',
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: mode === m ? '#fff' : c.textMuted }}>
              {m === 'login' ? 'Login' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'signup' && (
        <TextInput
          placeholder="Full Name"
          value={form.name}
          onChangeText={set('name')}
          style={{ marginBottom: 10, padding: 12, borderWidth: 1 }}
        />
      )}

      <TextInput
        placeholder="Phone"
        value={form.phone}
        onChangeText={set('phone')}
        style={{ marginBottom: 10, padding: 12, borderWidth: 1 }}
      />

      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={set('email')}
        style={{ marginBottom: 10, padding: 12, borderWidth: 1 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={set('password')}
        style={{ marginBottom: 20, padding: 12, borderWidth: 1 }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: c.primary,
          padding: 15,
          borderRadius: 10,
          alignItems: 'center'
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff' }}>
              {mode === 'login' ? 'Login' : 'Register'}
            </Text>}
      </TouchableOpacity>

    </ScrollView>
  );
}