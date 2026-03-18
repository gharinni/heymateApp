import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import { useAppTheme } from '../context/AppThemeContext';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const saveStorage = async (key, value) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    await AS.setItem(key, value);
  }
};

export default function LoginScreen({ navigation }) {
  const dispatch        = useDispatch();
  const { colors: c }  = useAppTheme();

  const [mode, setMode]     = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({
    name: '', phone: '', email: '', password: '', role: 'USER',
  });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let url, body;

      if (mode === 'login') {
        if (!form.phone && !form.email) {
          Alert.alert('Error', 'Enter phone or email'); setLoading(false); return;
        }
        if (!form.password) {
          Alert.alert('Error', 'Enter password'); setLoading(false); return;
        }
        url  = `${BACKEND}/auth/login`;
        body = form.phone
          ? { phone: form.phone.trim(), password: form.password }
          : { email: form.email.trim().toLowerCase(), password: form.password };
      } else {
        if (!form.name.trim())              { Alert.alert('Error', 'Enter your name'); setLoading(false); return; }
        if (form.phone.trim().length !== 10){ Alert.alert('Error', 'Phone must be 10 digits'); setLoading(false); return; }
        if (form.password.length < 6)       { Alert.alert('Error', 'Password min 6 chars'); setLoading(false); return; }
        url  = `${BACKEND}/auth/register`;
        body = {
          name:     form.name.trim(),
          phone:    form.phone.trim(),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
          role:     form.role,
        };
      }

      const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}

      // Handle nested response
      const userData = data?.token ? data : data?.data || data;

      if (userData?.token) {
        // Normalize role
        if (userData.role) userData.role = userData.role.toUpperCase();
        else userData.role = 'USER';

        // Save to storage
        await saveStorage('token', userData.token);
        await saveStorage('user', JSON.stringify(userData));

        // Update Redux — AppNavigator auto-switches to Main
        dispatch(setUser(userData));

      } else {
        const msg = data?.message || data?.error || data?.data?.message || text || 'Something went wrong';
        Alert.alert(mode === 'login' ? 'Login Failed' : 'Registration Failed', msg);
      }

    } catch (e) {
      Alert.alert('Network Error', 'Cannot connect to server.\nCheck your internet connection.\n\n' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 64 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontSize: 48 }}>⚡</Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: c.primary }}>HeyMate</Text>
        <Text style={{ color: c.textMuted, marginTop: 4 }}>One App, Any Task, Any Time</Text>
      </View>

      {/* Mode Toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 14,
        padding: 4, marginBottom: 28, borderWidth: 1, borderColor: c.border }}>
        {[{ v: 'login', l: '🔑 Login' }, { v: 'signup', l: '✍️ Sign Up' }].map(m => (
          <TouchableOpacity key={m.v} onPress={() => setMode(m.v)}
            style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
              backgroundColor: mode === m.v ? c.primary : 'transparent' }}>
            <Text style={{ color: mode === m.v ? '#fff' : c.textMuted, fontWeight: '700' }}>
              {m.l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Signup only fields */}
      {mode === 'signup' && (
        <>
          {/* Name */}
          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 6 }}>Full Name *</Text>
          <TextInput
            style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
              color: c.text, backgroundColor: c.card, marginBottom: 16, fontSize: 15 }}
            placeholder="Enter your full name" placeholderTextColor={c.textMuted}
            value={form.name} onChangeText={set('name')}
          />

          {/* Role */}
          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>I am a *</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[{ v: 'USER', l: '👤 Customer' }, { v: 'PROVIDER', l: '🔧 Provider' }].map(r => (
              <TouchableOpacity key={r.v} onPress={() => set('role')(r.v)}
                style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
                  borderWidth: 2, borderColor: form.role === r.v ? c.success : c.border,
                  backgroundColor: form.role === r.v ? `${c.success}18` : c.card }}>
                <Text style={{ color: form.role === r.v ? c.success : c.textMuted, fontWeight: '700' }}>
                  {r.l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Phone */}
      <Text style={{ color: c.text, fontWeight: '600', marginBottom: 6 }}>
        Phone Number {mode === 'signup' ? '*' : ''}
      </Text>
      <TextInput
        style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
          color: c.text, backgroundColor: c.card, marginBottom: 16, fontSize: 15 }}
        placeholder="10-digit phone number" placeholderTextColor={c.textMuted}
        value={form.phone} onChangeText={set('phone')}
        keyboardType="phone-pad" maxLength={10}
      />

      {/* Email */}
      <Text style={{ color: c.text, fontWeight: '600', marginBottom: 6 }}>
        Email {mode === 'signup' ? '(optional)' : '(or use phone above)'}
      </Text>
      <TextInput
        style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
          color: c.text, backgroundColor: c.card, marginBottom: 16, fontSize: 15 }}
        placeholder="Enter your email" placeholderTextColor={c.textMuted}
        value={form.email} onChangeText={set('email')}
        keyboardType="email-address" autoCapitalize="none"
      />

      {/* Password */}
      <Text style={{ color: c.text, fontWeight: '600', marginBottom: 6 }}>Password *</Text>
      <TextInput
        style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
          color: c.text, backgroundColor: c.card, marginBottom: 24, fontSize: 15 }}
        placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
        placeholderTextColor={c.textMuted}
        value={form.password} onChangeText={set('password')}
        secureTextEntry autoCapitalize="none"
      />

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{ backgroundColor: c.primary, borderRadius: 14, padding: 18,
          alignItems: 'center', opacity: loading ? 0.7 : 1 }}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="large" />
          : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
              {mode === 'login' ? '🚀 Login' : '✅ Create Account'}
            </Text>
        }
      </TouchableOpacity>

      {/* Toggle */}
      <TouchableOpacity
        onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); }}
        style={{ alignItems: 'center', marginTop: 20, padding: 10 }}
      >
        <Text style={{ color: c.textMuted }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <Text style={{ color: c.primary, fontWeight: '700' }}>
            {mode === 'login' ? 'Register Now' : 'Login'}
          </Text>
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
