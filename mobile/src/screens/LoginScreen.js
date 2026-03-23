import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Platform,
} from 'react-native';

// ── Direct Backend URL ────────────────────────────────────
const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const C = {
  bg:'#0D0D1A', card:'#1A1A2E', primary:'#FF5722',
  success:'#4CAF50', border:'#2A2A3E',
  text:'#FFFFFF', muted:'#9CA3AF', input:'#1E1E30',
};

// Save token to storage
const save = async (key, val) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, val);
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(key, val);
    }
  } catch(e) {}
};

export default function LoginScreen({ navigation }) {
  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]       = useState('USER');

  const submit = async () => {
    // Validate
    if (mode === 'login') {
      if (!phone.trim() && !email.trim()) { Alert.alert('Error', 'Enter phone or email'); return; }
      if (!password) { Alert.alert('Error', 'Enter password'); return; }
    } else {
      if (!name.trim()) { Alert.alert('Error', 'Enter your name'); return; }
      if (phone.length !== 10) { Alert.alert('Error', '10-digit phone required'); return; }
      if (password.length < 6) { Alert.alert('Error', 'Password min 6 chars'); return; }
    }

    setLoading(true);

    try {
      const url  = mode === 'login'
        ? `${BACKEND}/auth/login`
        : `${BACKEND}/auth/register`;

      const body = mode === 'login'
        ? (phone ? { phone: phone.trim(), password } : { email: email.trim().toLowerCase(), password })
        : { name: name.trim(), phone: phone.trim(), email: email.trim().toLowerCase(), password, role };

      // Set 10 second timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}

      // Handle response formats
      const user = data?.token ? data
        : data?.data?.token ? data.data
        : null;

      if (user?.token) {
        // Normalize role
        user.role = (user.role || 'USER').toUpperCase();

        // Save to storage
        await save('token', user.token);
        await save('user', JSON.stringify(user));

        // Navigate to Main - force navigation
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });

      } else {
        const msg = data?.message || data?.error || data?.data?.message
          || (response.status === 401 ? 'Wrong phone or password'
            : response.status === 409 ? 'Phone already registered'
            : response.status === 400 ? 'Check your details'
            : `Server error (${response.status})`);
        Alert.alert(mode === 'login' ? 'Login Failed' : 'Registration Failed', msg);
      }

    } catch (e) {
      if (e.name === 'AbortError') {
        Alert.alert('Timeout', 'Server too slow. Check internet and try again.');
      } else {
        Alert.alert('Connection Error', 'Cannot reach server.\n' + (e.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: C.input,
    color: '#FFFFFF', marginBottom: 14,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 36 }}>
        <Text style={{ fontSize: 54 }}>⚡</Text>
        <Text style={{ fontSize: 36, fontWeight: '800', color: C.primary, marginTop: 8 }}>
          HeyMate
        </Text>
        <Text style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>
          One App · Any Task · Any Time
        </Text>
      </View>

      {/* Login / Signup toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: C.card,
        borderRadius: 14, padding: 4, marginBottom: 24,
        borderWidth: 1, borderColor: C.border }}>
        {[{ v: 'login', l: 'Login' }, { v: 'signup', l: 'Sign Up' }].map(m => (
          <TouchableOpacity key={m.v} onPress={() => setMode(m.v)}
            style={{ flex: 1, paddingVertical: 12, borderRadius: 10,
              alignItems: 'center',
              backgroundColor: mode === m.v ? C.primary : 'transparent' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {m.l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Signup only */}
      {mode === 'signup' && (
        <>
          <Text style={{ color: C.text, fontWeight: '600', marginBottom: 8 }}>
            Full Name *
          </Text>
          <TextInput style={inp}
            placeholder="Enter your name"
            placeholderTextColor={C.muted}
            value={name} onChangeText={setName}
          />

          <Text style={{ color: C.text, fontWeight: '600', marginBottom: 8 }}>
            I am a *
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            {[{ v: 'USER', l: '👤 Customer' }, { v: 'PROVIDER', l: '🔧 Provider' }].map(r => (
              <TouchableOpacity key={r.v} onPress={() => setRole(r.v)}
                style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
                  borderWidth: 2,
                  borderColor: role === r.v ? C.success : C.border,
                  backgroundColor: role === r.v ? '#0a2a0a' : C.card }}>
                <Text style={{ color: role === r.v ? C.success : C.muted,
                  fontWeight: '700', fontSize: 14 }}>
                  {role === r.v ? '✓ ' : ''}{r.l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Phone */}
      <Text style={{ color: C.text, fontWeight: '600', marginBottom: 8 }}>
        Phone Number *
      </Text>
      <TextInput style={inp}
        placeholder="10-digit phone number"
        placeholderTextColor={C.muted}
        value={phone}
        onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
        keyboardType="phone-pad"
        maxLength={10}
      />

      {/* Email */}
      <Text style={{ color: C.text, fontWeight: '600', marginBottom: 8 }}>
        Email {mode === 'signup' ? '(optional)' : '(or use phone above)'}
      </Text>
      <TextInput style={inp}
        placeholder="Enter your email"
        placeholderTextColor={C.muted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <Text style={{ color: C.text, fontWeight: '600', marginBottom: 8 }}>
        Password *
      </Text>
      <TextInput style={[inp, { marginBottom: 28 }]}
        placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter password'}
        placeholderTextColor={C.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {/* Submit Button */}
      <TouchableOpacity
        onPress={submit}
        disabled={loading}
        style={{ backgroundColor: loading ? '#555' : C.primary,
          borderRadius: 14, padding: 18, alignItems: 'center' }}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="large" />
          : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Text>
        }
      </TouchableOpacity>

      {/* Toggle link */}
      <TouchableOpacity
        onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        style={{ alignItems: 'center', marginTop: 20, padding: 10 }}
      >
        <Text style={{ color: C.muted, fontSize: 14 }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <Text style={{ color: C.primary, fontWeight: '700' }}>
            {mode === 'login' ? 'Register Now' : 'Login'}
          </Text>
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
