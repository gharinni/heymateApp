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
  const dispatch       = useDispatch();
  const { colors: c } = useAppTheme();

  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    name: '', phone: '', email: '', password: '', role: 'USER',
  });

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    // Validation
    if (mode === 'login') {
      if (!form.phone.trim() && !form.email.trim()) {
        Alert.alert('Error', 'Enter your phone number or email');
        return;
      }
      if (!form.password.trim()) {
        Alert.alert('Error', 'Enter your password');
        return;
      }
    } else {
      if (!form.name.trim()) {
        Alert.alert('Error', 'Enter your full name');
        return;
      }
      if (form.phone.trim().length !== 10) {
        Alert.alert('Error', 'Enter valid 10-digit phone number');
        return;
      }
      if (form.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
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
            name:     form.name.trim(),
            phone:    form.phone.trim(),
            email:    form.email.trim().toLowerCase(),
            password: form.password,
            role:     form.role,
          };

      // 10 second timeout
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  controller.signal,
      });

      clearTimeout(timeout);

      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}

      // Handle both { token } and { data: { token } }
      const userData = data?.token ? data
        : data?.data?.token ? data.data
        : null;

      if (userData?.token) {
        // Normalize role
        userData.role = (userData.role || 'USER').toUpperCase();

        // Save to storage
        await saveStorage('token', userData.token);
        await saveStorage('user', JSON.stringify(userData));

        // Update Redux — AppNavigator auto switches to dashboard
        dispatch(setUser(userData));

      } else {
        const msg = data?.message
          || data?.error
          || data?.data?.message
          || (response.status === 401 ? 'Wrong phone or password'
            : response.status === 400 ? 'Check your details and try again'
            : response.status === 409 ? 'Phone number already registered'
            : `Error ${response.status} — try again`);

        Alert.alert(
          mode === 'login' ? '❌ Login Failed' : '❌ Registration Failed',
          msg
        );
      }

    } catch (e) {
      if (e.name === 'AbortError') {
        Alert.alert(
          '⏱️ Timeout',
          'Server took too long to respond.\nCheck your internet connection and try again.'
        );
      } else {
        Alert.alert(
          '🔴 Connection Error',
          'Cannot connect to server.\n\n' + (e.message || 'Unknown error')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 36 }}>
        <Text style={{ fontSize: 52 }}>⚡</Text>
        <Text style={{ fontSize: 34, fontWeight: '800', color: c.primary, marginTop: 8 }}>
          HeyMate
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 6 }}>
          One App · Any Task · Any Time
        </Text>
      </View>

      {/* Login / Sign Up Toggle */}
      <View style={{
        flexDirection: 'row', backgroundColor: c.card,
        borderRadius: 16, padding: 4, marginBottom: 24,
        borderWidth: 1, borderColor: c.border,
      }}>
        {[{ v: 'login', l: '🔑 Login' }, { v: 'signup', l: '✍️ Sign Up' }].map(m => (
          <TouchableOpacity
            key={m.v}
            onPress={() => setMode(m.v)}
            style={{
              flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
              backgroundColor: mode === m.v ? c.primary : 'transparent',
            }}
          >
            <Text style={{
              color: mode === m.v ? '#fff' : c.textMuted,
              fontWeight: '700', fontSize: 15,
            }}>
              {m.l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Up only fields */}
      {mode === 'signup' && (
        <>
          {/* Full Name */}
          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>
            Full Name *
          </Text>
          <TextInput
            style={{
              borderWidth: 1.5, borderColor: c.border, borderRadius: 14,
              padding: 16, color: c.text, backgroundColor: c.card,
              marginBottom: 16, fontSize: 15,
            }}
            placeholder="Enter your full name"
            placeholderTextColor={c.textMuted}
            value={form.name}
            onChangeText={set('name')}
          />

          {/* Role Selector */}
          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>
            I am a *
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[
              { v: 'USER',     l: '👤 Customer' },
              { v: 'PROVIDER', l: '🔧 Provider' },
            ].map(r => (
              <TouchableOpacity
                key={r.v}
                onPress={() => set('role')(r.v)}
                style={{
                  flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
                  borderWidth: 2,
                  borderColor: form.role === r.v ? c.success : c.border,
                  backgroundColor: form.role === r.v ? `${c.success}18` : c.card,
                }}
              >
                <Text style={{
                  color: form.role === r.v ? c.success : c.textMuted,
                  fontWeight: '700', fontSize: 14,
                }}>
                  {r.l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Phone Number */}
      <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>
        Phone Number {mode === 'signup' ? '*' : ''}
      </Text>
      <TextInput
        style={{
          borderWidth: 1.5, borderColor: c.border, borderRadius: 14,
          padding: 16, color: c.text, backgroundColor: c.card,
          marginBottom: 16, fontSize: 15,
        }}
        placeholder="10-digit phone number"
        placeholderTextColor={c.textMuted}
        value={form.phone}
        onChangeText={set('phone')}
        keyboardType="phone-pad"
        maxLength={10}
      />

      {/* Email */}
      <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>
        Email {mode === 'signup' ? '(optional)' : '(or use phone above)'}
      </Text>
      <TextInput
        style={{
          borderWidth: 1.5, borderColor: c.border, borderRadius: 14,
          padding: 16, color: c.text, backgroundColor: c.card,
          marginBottom: 16, fontSize: 15,
        }}
        placeholder="Enter your email"
        placeholderTextColor={c.textMuted}
        value={form.email}
        onChangeText={set('email')}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>
        Password *
      </Text>
      <TextInput
        style={{
          borderWidth: 1.5, borderColor: c.border, borderRadius: 14,
          padding: 16, color: c.text, backgroundColor: c.card,
          marginBottom: 28, fontSize: 15,
        }}
        placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
        placeholderTextColor={c.textMuted}
        value={form.password}
        onChangeText={set('password')}
        secureTextEntry
        autoCapitalize="none"
      />

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: loading ? c.textMuted : c.primary,
          borderRadius: 16, padding: 18, alignItems: 'center',
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="large" />
          : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
              {mode === 'login' ? '🚀 Login' : '✅ Create Account'}
            </Text>
        }
      </TouchableOpacity>

      {/* Toggle Mode */}
      <TouchableOpacity
        onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        style={{ alignItems: 'center', marginTop: 20, padding: 10 }}
      >
        <Text style={{ color: c.textMuted, fontSize: 14 }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <Text style={{ color: c.primary, fontWeight: '700' }}>
            {mode === 'login' ? 'Register Now' : 'Login'}
          </Text>
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
