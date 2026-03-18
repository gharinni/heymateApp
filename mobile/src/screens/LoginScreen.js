import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Modal, Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { loginThunk, registerThunk, setUser } from '../store/authSlice';
import { useAppTheme } from '../context/AppThemeContext';

const NEW_BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { colors: c } = useAppTheme();

  const [mode, setMode]           = useState('login'); // login | signup
  const [loginMode, setLoginMode] = useState('phone'); // phone | email
  const [role, setRole]           = useState('USER');
  const [loading, setLoading]     = useState(false);
  const [form, setForm]           = useState({
    name: '', phone: '', email: '', password: '',
    serviceType: '', pricePerUnit: '', description: '',
  });
  const [showPass, setShowPass] = useState(false);

  // Forgot password
  const [forgotModal, setForgotModal]     = useState(false);
  const [forgotStep, setForgotStep]       = useState(1);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [otp, setOtp]                     = useState('');
  const [generatedOtp, setGeneratedOtp]   = useState('');
  const [newPass, setNewPass]             = useState('');
  const [confirmPass, setConfirmPass]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const getToken = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('token');
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.getItem('token');
  };

  // ── SUBMIT ───────────────────────────────────────────────────────────────────
  const submit = async () => {
    setLoading(true);
    try {
      if (mode === 'login') {
        const credentials = loginMode === 'phone'
          ? { phone: form.phone.trim(), password: form.password }
          : { email: form.email.trim().toLowerCase(), password: form.password };

        if (!credentials.phone && !credentials.email) {
          Alert.alert('Error', 'Enter your phone or email'); setLoading(false); return;
        }
        if (!form.password) {
          Alert.alert('Error', 'Enter your password'); setLoading(false); return;
        }

        // Direct fetch — more reliable than axios on web
        const response = await fetch('https://distinguished-elegance-production.up.railway.app/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const res = await response.json();

        if (res?.token) {
          // Save token
          if (Platform.OS === 'web') {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res));
          } else {
            const AS = (await import('@react-native-async-storage/async-storage')).default;
            await AS.setItem('token', res.token);
            await AS.setItem('user', JSON.stringify(res));
          }
          // Normalize role and dispatch to Redux
          if (res.role) res.role = res.role.toUpperCase();
          if (!res.role) res.role = 'USER';
          // Dispatch setUser — AppNavigator automatically shows Main screen
          dispatch(setUser(res));
        } else {
          Alert.alert('Login Failed', res?.message || res?.error || 'Check your credentials.');
        }

      } else {
        // Signup validation
        if (!form.name.trim())    { Alert.alert('Error', 'Enter your name'); setLoading(false); return; }
        if (!form.phone.trim())   { Alert.alert('Error', 'Enter phone number'); setLoading(false); return; }
        if (form.phone.trim().length !== 10) { Alert.alert('Error', 'Phone must be 10 digits'); setLoading(false); return; }
        if (!form.password || form.password.length < 6) { Alert.alert('Error', 'Password min 6 chars'); setLoading(false); return; }

        // Direct fetch for registration
        const regResponse = await fetch('https://distinguished-elegance-production.up.railway.app/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, role }),
        });
        const regRes = await regResponse.json();

        if (regRes?.token) {
          if (Platform.OS === 'web') {
            localStorage.setItem('token', regRes.token);
            localStorage.setItem('user', JSON.stringify(regRes));
          } else {
            const AS = (await import('@react-native-async-storage/async-storage')).default;
            await AS.setItem('token', regRes.token);
            await AS.setItem('user', JSON.stringify(regRes));
          }
          if (regRes.role) regRes.role = regRes.role.toUpperCase();
          if (!regRes.role) regRes.role = 'USER';
          dispatch(setUser(regRes));
          Alert.alert('✅ Account Created!', 'Welcome to HeyMate!');
        } else {
          Alert.alert('Registration Failed', regRes?.message || regRes?.error || 'Try again.');
        }
      }
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.includes('Network') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
        Alert.alert('Cannot Connect', 'Check your internet connection.\n\n' + msg);
      } else {
        Alert.alert(mode === 'login' ? 'Login Failed' : 'Registration Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT PASSWORD ──────────────────────────────────────────────────────────
  const sendOtp = async () => {
    if (!forgotEmail.trim()) { Alert.alert('Error', 'Enter email'); return; }
    setForgotLoading(true);
    try {
      const res  = await fetch(`${NEW_BACKEND}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedOtp(data.otp || '');
        setForgotStep(2);
        Alert.alert('✅ OTP Sent!', data.otp ? `OTP: ${data.otp} (dev mode)` : 'Check your email.');
      } else Alert.alert('Error', data.message || 'Email not found');
    } catch { Alert.alert('Error', 'Cannot connect'); }
    finally { setForgotLoading(false); }
  };

  const verifyOtp = () => {
    if (!otp.trim()) { Alert.alert('Error', 'Enter OTP'); return; }
    if (otp.trim() !== generatedOtp.trim() && otp.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Check and try again.'); return;
    }
    setForgotStep(3);
  };

  const resetPassword = async () => {
    if (!newPass || newPass.length < 6) { Alert.alert('Error', 'Password min 6 chars'); return; }
    if (newPass !== confirmPass)         { Alert.alert('Error', 'Passwords do not match'); return; }
    setForgotLoading(true);
    try {
      const res  = await fetch(`${NEW_BACKEND}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp: otp.trim(), password: newPass }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotModal(false); setForgotStep(1);
        setForgotEmail(''); setOtp(''); setNewPass(''); setConfirmPass('');
        Alert.alert('✅ Password Reset!', 'Login with your new password.');
      } else Alert.alert('Error', data.message || 'Reset failed');
    } catch { Alert.alert('Error', 'Cannot connect'); }
    finally { setForgotLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} keyboardShouldPersistTaps="handled">
      <View style={{ padding: 24, paddingTop: 64 }}>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <Text style={{ fontSize: 44 }}>⚡</Text>
          <Text style={{ fontSize: 32, fontWeight: '800', color: c.primary, marginTop: 8 }}>HeyMate</Text>
          <Text style={{ fontSize: 15, color: c.textMuted, marginTop: 4 }}>One App, Any Task, Any Time</Text>
        </View>

        {/* Mode toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
          {[{ v: 'login', l: '🔑 Login' }, { v: 'signup', l: '✍️ Sign Up' }].map(m => (
            <TouchableOpacity key={m.v} onPress={() => setMode(m.v)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                backgroundColor: mode === m.v ? c.primary : 'transparent' }}>
              <Text style={{ color: mode === m.v ? '#fff' : c.textMuted, fontWeight: '700', fontSize: 14 }}>
                {m.l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Signup fields */}
        {mode === 'signup' && (
          <>
            <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Full Name *</Text>
            <TextInput style={[inputStyle(c)]}
              placeholder="Enter your name" placeholderTextColor={c.textMuted}
              value={form.name} onChangeText={set('name')} />

            {/* Role selector */}
            <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>I am a *</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[{ v: 'USER', l: '👤 Customer' }, { v: 'PROVIDER', l: '🔧 Provider' }].map(r => (
                <TouchableOpacity key={r.v} onPress={() => setRole(r.v)}
                  style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 2,
                    borderColor: role === r.v ? c.success : c.border,
                    backgroundColor: role === r.v ? `${c.success}18` : c.card }}>
                  <Text style={{ color: role === r.v ? c.success : c.textMuted, fontWeight: '700' }}>{r.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {role === 'PROVIDER' && (
              <>
                <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Service Type</Text>
                <TextInput style={inputStyle(c)}
                  placeholder="e.g. Plumber, Tutor" placeholderTextColor={c.textMuted}
                  value={form.serviceType} onChangeText={set('serviceType')} />
              </>
            )}
          </>
        )}

        {/* Login mode toggle (only for login) */}
        {mode === 'login' && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[{ v: 'phone', l: '📱 Phone' }, { v: 'email', l: '📧 Email' }].map(lm => (
              <TouchableOpacity key={lm.v} onPress={() => setLoginMode(lm.v)}
                style={{ flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1.5,
                  borderColor: loginMode === lm.v ? c.primary : c.border,
                  backgroundColor: loginMode === lm.v ? `${c.primary}18` : c.card }}>
                <Text style={{ color: loginMode === lm.v ? c.primary : c.textMuted, fontWeight: '600', fontSize: 13 }}>
                  {lm.l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Phone field */}
        {(mode === 'signup' || (mode === 'login' && loginMode === 'phone')) && (
          <>
            <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Phone Number *</Text>
            <TextInput style={inputStyle(c)}
              placeholder="10-digit phone number" placeholderTextColor={c.textMuted}
              value={form.phone} onChangeText={set('phone')}
              keyboardType="phone-pad" maxLength={10} />
          </>
        )}

        {/* Email field */}
        {(mode === 'signup' || (mode === 'login' && loginMode === 'email')) && (
          <>
            <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>
              {mode === 'signup' ? 'Email (optional)' : 'Email Address *'}
            </Text>
            <TextInput style={inputStyle(c)}
              placeholder="Enter your email" placeholderTextColor={c.textMuted}
              value={form.email} onChangeText={set('email')}
              keyboardType="email-address" autoCapitalize="none" />
          </>
        )}

        {/* Password */}
        <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Password *</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TextInput style={[inputStyle(c), { flex: 1, marginBottom: 0 }]}
            placeholder="Min 6 characters" placeholderTextColor={c.textMuted}
            value={form.password} onChangeText={set('password')}
            secureTextEntry={!showPass} autoCapitalize="none" />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 22 }}>{showPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot password */}
        {mode === 'login' && (
          <TouchableOpacity onPress={() => setForgotModal(true)}
            style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
            <Text style={{ color: c.primary, fontWeight: '600' }}>🔑 Forgot Password?</Text>
          </TouchableOpacity>
        )}

        {/* Submit button */}
        <TouchableOpacity onPress={submit} disabled={loading}
          style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16,
            alignItems: 'center', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                {mode === 'login' ? '🚀 Login' : '✅ Create Account'}
              </Text>
          }
        </TouchableOpacity>

        {/* Toggle mode */}
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
          <Text style={{ color: c.textMuted, fontSize: 14 }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <Text style={{ color: c.primary, fontWeight: '700', fontSize: 14 }}>
            {mode === 'login' ? 'Register Now' : 'Login'}
          </Text>
        </TouchableOpacity>

      </View>

      {/* FORGOT PASSWORD MODAL */}
      <Modal visible={forgotModal} animationType="slide" transparent
        onRequestClose={() => { setForgotModal(false); setForgotStep(1); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>🔑 Forgot Password</Text>
              <TouchableOpacity onPress={() => { setForgotModal(false); setForgotStep(1); }}>
                <Text style={{ fontSize: 26, color: c.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {forgotStep === 1 && (
              <>
                <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Enter your email</Text>
                <TextInput style={inputStyle(c)}
                  placeholder="Registered email address" placeholderTextColor={c.textMuted}
                  value={forgotEmail} onChangeText={setForgotEmail}
                  keyboardType="email-address" autoCapitalize="none" />
                <TouchableOpacity onPress={sendOtp} disabled={forgotLoading}
                  style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center' }}>
                  {forgotLoading ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: '#fff', fontWeight: '800' }}>📨 Send OTP</Text>}
                </TouchableOpacity>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <Text style={{ color: c.textMuted, marginBottom: 16 }}>OTP sent to {forgotEmail}</Text>
                <TextInput style={[inputStyle(c), { fontSize: 24, textAlign: 'center', letterSpacing: 10 }]}
                  placeholder="000000" placeholderTextColor={c.textMuted}
                  value={otp} onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad" maxLength={6} />
                <TouchableOpacity onPress={verifyOtp}
                  style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>✅ Verify OTP</Text>
                </TouchableOpacity>
              </>
            )}

            {forgotStep === 3 && (
              <>
                <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>New Password</Text>
                <TextInput style={inputStyle(c)}
                  placeholder="Min 6 characters" placeholderTextColor={c.textMuted}
                  value={newPass} onChangeText={setNewPass} secureTextEntry />
                <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Confirm Password</Text>
                <TextInput style={inputStyle(c)}
                  placeholder="Re-enter password" placeholderTextColor={c.textMuted}
                  value={confirmPass} onChangeText={setConfirmPass} secureTextEntry />
                <TouchableOpacity onPress={resetPassword} disabled={forgotLoading}
                  style={{ backgroundColor: c.success, borderRadius: 14, padding: 16, alignItems: 'center' }}>
                  {forgotLoading ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: '#fff', fontWeight: '800' }}>🔐 Reset Password</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const inputStyle = c => ({
  borderWidth: 1.5, borderColor: c.border, borderRadius: 12,
  padding: 14, fontSize: 15, backgroundColor: c.card,
  color: c.text, marginBottom: 16,
});
