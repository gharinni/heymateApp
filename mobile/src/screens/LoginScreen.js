import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
  Platform, KeyboardAvoidingView, Keyboard,
  TouchableWithoutFeedback, StyleSheet,
} from 'react-native';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const C = {
  bg:'#0D0D1A', card:'#1A1A2E', primary:'#FF5722',
  success:'#4CAF50', border:'#2A2A3E',
  text:'#FFFFFF', muted:'#9CA3AF', input:'#1E1E30',
};

const sv = async (k, v) => {
  try {
    if (Platform.OS === 'web') { localStorage.setItem(k, v); return; }
    const A = (await import('@react-native-async-storage/async-storage')).default;
    await A.setItem(k, v);
  } catch {}
};

export default function LoginScreen({ navigation }) {
  const [mode, setMode]   = useState('login');
  const [loading, setL]   = useState(false);
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [role, setRole]   = useState('USER');

  const submit = async () => {
    // Validation
    if (mode === 'login') {
      if (!phone.trim() && !email.trim()) {
        Alert.alert('Error', 'Enter phone or email'); return;
      }
      if (!pass) { Alert.alert('Error', 'Enter password'); return; }
    } else {
      if (!name.trim()) { Alert.alert('Error', 'Enter name'); return; }
      if (phone.length !== 10) { Alert.alert('Error', '10-digit phone required'); return; }
      if (pass.length < 6) { Alert.alert('Error', 'Password min 6 chars'); return; }
    }

    setL(true);
    try {
      const url  = mode === 'login'
        ? `${BACKEND}/auth/login`
        : `${BACKEND}/auth/register`;

      const body = mode === 'login'
        ? (phone.trim()
            ? { phone: phone.trim(), password: pass }
            : { email: email.trim().toLowerCase(), password: pass })
        : {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            password: pass,
            role,
          };

      const ctrl = new AbortController();
      const t    = setTimeout(() => ctrl.abort(), 10000);
      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(t);

      let data = {};
      try { data = JSON.parse(await res.text()); } catch {}

      const user = data?.token ? data : data?.data?.token ? data.data : null;

      if (user?.token) {
        user.role = (user.role || 'USER').toUpperCase();
        await sv('token', user.token);
        await sv('user', JSON.stringify(user));
        try {
          navigation.replace('Main');
        } catch {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }
      } else {
        Alert.alert(
          mode === 'login' ? 'Login Failed' : 'Registration Failed',
          data?.message || data?.error
            || (res.status === 401 ? 'Wrong credentials'
              : res.status === 409 ? 'Phone already registered'
              : `Error ${res.status}`)
        );
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e.name === 'AbortError' ? 'Timeout - try again' : (e.message || 'Cannot connect')
      );
    } finally { setL(false); }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        {/* ── Logo ─────────────────────────────────────── */}
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>⚡</Text>
          <Text style={styles.logoText}>HeyMate</Text>
          <Text style={styles.logoSub}>One App · Any Task · Any Time</Text>
        </View>

        {/* ── Toggle ───────────────────────────────────── */}
        <View style={styles.toggle}>
          {[{ v: 'login', l: 'Login' }, { v: 'signup', l: 'Sign Up' }].map(m => (
            <TouchableOpacity
              key={m.v}
              onPress={() => setMode(m.v)}
              style={[styles.toggleBtn, mode === m.v && styles.toggleActive]}
            >
              <Text style={styles.toggleText}>{m.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sign Up Only ──────────────────────────────── */}
        {mode === 'signup' && (
          <>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={C.muted}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />

            <Text style={styles.label}>I am a *</Text>
            <View style={styles.roleRow}>
              {[{ v: 'USER', l: '👤 Customer' }, { v: 'PROVIDER', l: '🔧 Provider' }].map(r => (
                <TouchableOpacity
                  key={r.v}
                  onPress={() => setRole(r.v)}
                  style={[styles.roleBtn, role === r.v && styles.roleBtnActive]}
                >
                  <Text style={[styles.roleTxt, role === r.v && styles.roleTxtActive]}>
                    {role === r.v ? '✓ ' : ''}{r.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Phone ────────────────────────────────────── */}
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit phone number"
          placeholderTextColor={C.muted}
          value={phone}
          onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          maxLength={10}
          returnKeyType="next"
        />

        {/* ── Email ────────────────────────────────────── */}
        <Text style={styles.label}>
          Email {mode === 'signup' ? '(optional)' : '(or use phone above)'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={C.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        {/* ── Password ─────────────────────────────────── */}
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={[styles.input, { marginBottom: 32 }]}
          placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
          placeholderTextColor={C.muted}
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {/* ── Submit Button ─────────────────────────────── */}
        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          activeOpacity={0.85}
          style={[styles.btn, loading && styles.btnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="large" />
            : <Text style={styles.btnText}>
                {mode === 'login' ? '🚀 Login' : '✅ Create Account'}
              </Text>}
        </TouchableOpacity>

        {/* ── Switch Mode ──────────────────────────────── */}
        <TouchableOpacity
          onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          style={styles.switchRow}
        >
          <Text style={styles.switchTxt}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <Text style={styles.switchLink}>
              {mode === 'login' ? 'Register Now' : 'Login'}
            </Text>
          </Text>
        </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  kav:           { flex: 1, backgroundColor: C.bg },
  scroll:        { flex: 1 },
  content:       {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },
  logoBox:       { alignItems: 'center', marginBottom: 32 },
  logoEmoji:     { fontSize: 54 },
  logoText:      { fontSize: 34, fontWeight: '800', color: C.primary, marginTop: 8 },
  logoSub:       { color: C.muted, fontSize: 14, marginTop: 4 },
  toggle:        { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  toggleBtn:     { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  toggleActive:  { backgroundColor: C.primary },
  toggleText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  label:         { color: C.text, fontWeight: '600', fontSize: 14, marginBottom: 8 },
  input:         {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: C.input,
    color: '#FFFFFF',
    marginBottom: 14,
  },
  roleRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleBtn:       { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: C.border, backgroundColor: C.card },
  roleBtnActive: { borderColor: C.success, backgroundColor: '#0a2a0a' },
  roleTxt:       { color: C.muted, fontWeight: '700', fontSize: 14 },
  roleTxtActive: { color: C.success },
  btn:           {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 6,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  btnDisabled:   { backgroundColor: '#555' },
  btnText:       { color: '#fff', fontWeight: '800', fontSize: 17 },
  switchRow:     { alignItems: 'center', padding: 10 },
  switchTxt:     { color: C.muted, fontSize: 14 },
  switchLink:    { color: C.primary, fontWeight: '700' },
});
