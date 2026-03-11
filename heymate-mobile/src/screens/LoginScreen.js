import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser } from '../store/slices/authSlice';
import { COLORS } from '../constants';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const [mode, setMode] = useState('login'); // login | signup
  const [role, setRole] = useState('USER');
  const [form, setForm] = useState({ name: '', phone: '', password: '', serviceType: '' });

  const handleSubmit = async () => {
    if (!form.phone || !form.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (mode === 'login') {
      dispatch(loginUser({ phone: form.phone, password: form.password }));
    } else {
      dispatch(registerUser({ ...form, role }));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Logo */}
      <View style={styles.logoBox}>
        <Text style={styles.logoEmoji}>⚡</Text>
        <Text style={styles.logoText}>Hey<Text style={{ color: COLORS.primary }}>Mate</Text></Text>
        <Text style={styles.tagline}>One App · Any Task · Any Time</Text>
      </View>

      {/* Role Toggle */}
      <View style={styles.toggleRow}>
        {['USER', 'PROVIDER'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.toggleBtn, role === r && styles.toggleActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.toggleText, role === r && styles.toggleTextActive]}>
              {r === 'USER' ? '👤 User' : '🧰 Provider'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeRow}>
        {['login', 'signup'].map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.modeBtnText, mode === m && { color: COLORS.primary }]}>
              {m === 'login' ? 'Login' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form */}
      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={COLORS.textMuted}
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => setForm({ ...form, phone: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry
        value={form.password}
        onChangeText={(v) => setForm({ ...form, password: v })}
      />

      {mode === 'signup' && role === 'PROVIDER' && (
        <TextInput
          style={styles.input}
          placeholder="Service Category (e.g. PLUMBER)"
          placeholderTextColor={COLORS.textMuted}
          value={form.serviceType}
          onChangeText={(v) => setForm({ ...form, serviceType: v.toUpperCase() })}
        />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>{mode === 'login' ? '🚀 Login' : '✅ Create Account'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingTop: 60 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 52 },
  logoText: { fontSize: 36, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  tagline: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  toggleRow: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 14, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { color: COLORS.textMuted, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  modeBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}18` },
  modeBtnText: { color: COLORS.textMuted, fontWeight: '600' },
  input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, color: COLORS.text, fontSize: 14, marginBottom: 12 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: COLORS.danger, fontSize: 13, marginBottom: 8, textAlign: 'center' },
});
