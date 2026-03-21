import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const saveStorage = async (key, value) => {
  try {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(key, value);
    }
  } catch {}
};

const COLORS = {
  bg: '#0D0D1A', card: '#1A1A2E', primary: '#FF5722',
  success: '#4CAF50', border: '#2A2A3E',
  text: '#FFFFFF', textMuted: '#9CA3AF', input: '#1E1E30',
};

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    name: '', phone: '', email: '', password: '', role: 'USER',
  });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (mode === 'login') {
      if (!form.phone.trim() && !form.email.trim()) { Alert.alert('Error', 'Enter phone or email'); return; }
      if (!form.password.trim()) { Alert.alert('Error', 'Enter password'); return; }
    } else {
      if (!form.name.trim()) { Alert.alert('Error', 'Enter your name'); return; }
      if (form.phone.trim().length !== 10) { Alert.alert('Error', '10-digit phone required'); return; }
      if (form.password.length < 6) { Alert.alert('Error', 'Password min 6 chars'); return; }
    }

    setLoading(true);
    try {
      const url  = mode === 'login' ? `${BACKEND}/auth/login` : `${BACKEND}/auth/register`;
      const body = mode === 'login'
        ? (form.phone.trim()
            ? { phone: form.phone.trim(), password: form.password }
            : { email: form.email.trim().toLowerCase(), password: form.password })
        : { name: form.name.trim(), phone: form.phone.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password, role: form.role };

      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 10000);

      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}

      const userData = data?.token ? data : data?.data?.token ? data.data : null;

      if (userData?.token) {
        userData.role = (userData.role || 'USER').toUpperCase();
        await saveStorage('token', userData.token);
        await saveStorage('user', JSON.stringify(userData));
        dispatch(setUser(userData));
        // Navigate to Main after login
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        const msg = data?.message || data?.error
          || (res.status === 401 ? 'Wrong phone or password'
            : res.status === 409 ? 'Phone already registered'
            : `Error ${res.status}`);
        Alert.alert(mode === 'login' ? 'Login Failed' : 'Registration Failed', msg);
      }
    } catch (e) {
      if (e.name === 'AbortError') Alert.alert('Timeout', 'Server too slow. Try again.');
      else Alert.alert('Error', 'Cannot connect: ' + (e.message || ''));
    } finally { setLoading(false); }
  };

  const inp = {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: COLORS.input,
    color: '#FFFFFF', marginBottom: 14,
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 60 }}
      keyboardShouldPersistTaps="handled">

      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontSize: 56 }}>⚡</Text>
        <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.primary, marginTop: 8 }}>HeyMate</Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 6 }}>One App · Any Task · Any Time</Text>
      </View>

      {/* Toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 16,
        padding: 4, marginBottom: 28, borderWidth: 1, borderColor: COLORS.border }}>
        {[{ v: 'login', l: 'Login' }, { v: 'signup', l: 'Sign Up' }].map(m => (
          <TouchableOpacity key={m.v} onPress={() => setMode(m.v)}
            style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
              backgroundColor: mode === m.v ? COLORS.primary : 'transparent' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{m.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Signup fields */}
      {mode === 'signup' && (
        <>
          <Text style={{ color: COLORS.text, fontWeight: '600', marginBottom: 8 }}>Full Name *</Text>
          <TextInput style={inp} placeholder="Enter your full name"
            placeholderTextColor={COLORS.textMuted} value={form.name} onChangeText={set('name')} />

          <Text style={{ color: COLORS.text, fontWeight: '600', marginBottom: 8 }}>I am a *</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            {[{ v: 'USER', l: '👤 Customer' }, { v: 'PROVIDER', l: '🔧 Provider' }].map(r => (
              <TouchableOpacity key={r.v} onPress={() => set('role')(r.v)}
                style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
                  borderWidth: 2, borderColor: form.role === r.v ? COLORS.success : COLORS.border,
                  backgroundColor: form.role === r.v ? '#1a3a1a' : COLORS.card }}>
                <Text style={{ color: form.role === r.v ? COLORS.success : COLORS.textMuted,
                  fontWeight: '700', fontSize: 14 }}>
                  {form.role === r.v ? '✓ ' : ''}{r.l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={{ color: COLORS.text, fontWeight: '600', marginBottom: 8 }}>Phone Number *</Text>
      <TextInput style={inp} placeholder="10-digit phone number"
        placeholderTextColor={COLORS.textMuted} value={form.phone} onChangeText={set('phone')}
        keyboardType="phone-pad" maxLength={10} />

      <Text style={{ color: COLORS.text, fontWeight: '600', marginBottom: 8 }}>
        Email {mode === 'signup' ? '(optional)' : '(or use phone above)'}
      </Text>
      <TextInput style={inp} placeholder="Enter your email"
        placeholderTextColor={COLORS.textMuted} value={form.email} onChangeText={set('email')}
        keyboardType="email-address" autoCapitalize="none" />

      <Text style={{ color: COLORS.text, fontWeight: '600', marginBottom: 8 }}>Password *</Text>
      <TextInput style={[inp, { marginBottom: 28 }]}
        placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
        placeholderTextColor={COLORS.textMuted} value={form.password} onChangeText={set('password')}
        secureTextEntry autoCapitalize="none" />

      <TouchableOpacity onPress={handleSubmit} disabled={loading}
        style={{ backgroundColor: loading ? COLORS.textMuted : COLORS.primary,
          borderRadius: 16, padding: 18, alignItems: 'center' }}>
        {loading ? <ActivityIndicator color="#fff" size="large" />
          : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        style={{ alignItems: 'center', marginTop: 20, padding: 10 }}>
        <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
            {mode === 'login' ? 'Register Now' : 'Login'}
          </Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
