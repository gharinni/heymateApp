import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { loginThunk, registerThunk } from '../store/authSlice';
import { useAppTheme } from '../context/AppThemeContext';
import { API_URL } from '../api/index';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { colors: c, isDark } = useAppTheme();

  const [mode, setMode]       = useState('login');   // login | signup
  const [role, setRole]       = useState('USER');
  const [loginMode, setLoginMode] = useState('phone'); // phone | email
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name:'', phone:'', email:'', password:'', serviceType:'', pricePerUnit:'', description:'' });
  const [showPass, setShowPass] = useState(false);

  // Forgot password
  const [forgotModal, setForgotModal]   = useState(false);
  const [forgotStep, setForgotStep]     = useState(1);
  const [forgotEmail, setForgotEmail]   = useState('');
  const [otp, setOtp]                   = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPass, setNewPass]           = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      if (mode === 'login') {
        const credentials = loginMode === 'phone'
          ? { phone: form.phone, password: form.password }
          : { email: form.email.trim().toLowerCase(), password: form.password };
        const res = await dispatch(loginThunk(credentials)).unwrap();
        if (!res?.token) Alert.alert('Login Failed', 'Check your credentials.');
      } else {
        if (!form.name.trim())     { Alert.alert('Error','Enter your name'); return; }
        if (form.phone.length!==10){ Alert.alert('Error','Enter 10-digit phone'); return; }
        if (!form.password||form.password.length<6){ Alert.alert('Error','Password min 6 chars'); return; }
        await dispatch(registerThunk({ ...form, role })).unwrap();
      }
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.includes('Network')||msg.includes('ECONNREFUSED')) {
        Alert.alert('Cannot Connect','Check internet or backend.\n'+msg);
      } else {
        Alert.alert(mode==='login'?'Login Failed':'Registration Failed', msg);
      }
    } finally { setLoading(false); }
  };

  const sendOtp = async () => {
    if (!forgotEmail.trim()) { Alert.alert('Error','Enter email'); return; }
    setForgotLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/forgot-password`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedOtp(data.otp||'');
        setForgotStep(2);
        Alert.alert('✅ OTP Sent!', data.otp ? `OTP: ${data.otp} (dev mode)` : 'Check your email.');
      } else Alert.alert('Error', data.message||'Email not found');
    } catch { Alert.alert('Error','Cannot connect'); }
    finally { setForgotLoading(false); }
  };

  const verifyOtp = () => {
    if (!otp.trim()) { Alert.alert('Error','Enter OTP'); return; }
    if (otp.trim()!==generatedOtp.trim()&&otp.trim().length!==6) {
      Alert.alert('Invalid OTP','Check and try again.'); return;
    }
    setForgotStep(3);
  };

  const resetPassword = async () => {
    if (!newPass||newPass.length<6) { Alert.alert('Error','Min 6 chars'); return; }
    if (newPass!==confirmPass)      { Alert.alert('Error','Passwords don\'t match'); return; }
    setForgotLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/reset-password`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp: otp.trim(), password: newPass }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotModal(false); setForgotStep(1);
        setForgotEmail(''); setOtp(''); setNewPass(''); setConfirmPass('');
        Alert.alert('✅ Password Reset!','Login with your new password.');
      } else Alert.alert('Error', data.message||'Reset failed');
    } catch { Alert.alert('Error','Cannot connect'); }
    finally { setForgotLoading(false); }
  };

  const closeForgot = () => {
    setForgotModal(false); setForgotStep(1);
    setForgotEmail(''); setOtp(''); setNewPass(''); setConfirmPass('');
  };

  const inp = [
    { borderWidth:1.5, borderColor:c.border, borderRadius:12, padding:14,
      fontSize:15, backgroundColor:c.card, marginBottom:14, color:c.text }
  ];

  return (
    <ScrollView style={{ flex:1, backgroundColor:c.bg }} keyboardShouldPersistTaps="handled">
      <View style={{ padding:24, paddingTop:70 }}>

        {/* Logo */}
        <View style={{ alignItems:'center', marginBottom:36 }}>
          <View style={{ width:72, height:72, borderRadius:20, backgroundColor:c.primary, alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <Text style={{ fontSize:36 }}>⚡</Text>
          </View>
          <Text style={{ fontSize:32, fontWeight:'800', color:c.text }}>
            Hey<Text style={{ color:c.primary }}>Mate</Text>
          </Text>
          <Text style={{ color:c.textMuted, fontSize:13, marginTop:4 }}>One App · Any Task · Any Time</Text>
        </View>

        {/* Mode tabs */}
        <View style={{ flexDirection:'row', backgroundColor:c.card, borderRadius:14, padding:4, marginBottom:14, borderWidth:1, borderColor:c.border }}>
          {['login','signup'].map(m => (
            <TouchableOpacity key={m} onPress={() => setMode(m)}
              style={{ flex:1, padding:10, borderRadius:10, alignItems:'center', backgroundColor:mode===m?c.primary:'transparent' }}>
              <Text style={{ color:mode===m?'#fff':c.textMuted, fontWeight:'700', fontSize:13 }}>
                {m==='login'?'🔑 Login':'✍️ Sign Up'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Role toggle (signup only) */}
        {mode==='signup' && (
          <View style={{ flexDirection:'row', backgroundColor:c.card, borderRadius:14, padding:4, marginBottom:14, borderWidth:1, borderColor:c.border }}>
            {[{v:'USER',label:'👤 User'},{v:'PROVIDER',label:'🧰 Provider'}].map(r => (
              <TouchableOpacity key={r.v} onPress={() => setRole(r.v)}
                style={{ flex:1, padding:10, borderRadius:10, alignItems:'center', backgroundColor:role===r.v?c.success:'transparent' }}>
                <Text style={{ color:role===r.v?'#fff':c.textMuted, fontWeight:'700', fontSize:13 }}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Login mode toggle */}
        {mode==='login' && (
          <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
            {['phone','email'].map(lm => (
              <TouchableOpacity key={lm} onPress={() => setLoginMode(lm)}
                style={{ flex:1, padding:10, borderRadius:12, borderWidth:1.5, alignItems:'center',
                  borderColor:loginMode===lm?c.primary:c.border,
                  backgroundColor:loginMode===lm?`${c.primary}18`:c.card }}>
                <Text style={{ color:loginMode===lm?c.primary:c.textMuted, fontWeight:'600', fontSize:13 }}>
                  {lm==='phone'?'📱 Phone':'📧 Email'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Name (signup) */}
        {mode==='signup' && (
          <TextInput style={inp[0]} placeholder="Full Name" placeholderTextColor={c.textMuted}
            value={form.name} onChangeText={set('name')} autoCapitalize="words" />
        )}

        {/* Phone / Email */}
        {(mode==='signup'||loginMode==='phone') ? (
          <View style={{ flexDirection:'row', gap:10, marginBottom:14 }}>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:c.card, borderRadius:12, borderWidth:1.5, borderColor:c.border, paddingHorizontal:12 }}>
              <Text style={{ fontSize:18 }}>🇮🇳</Text>
              <Text style={{ color:c.text, fontWeight:'600', marginLeft:4 }}>+91</Text>
            </View>
            <TextInput style={[inp[0],{flex:1,marginBottom:0}]} placeholder="10-digit phone"
              placeholderTextColor={c.textMuted} value={form.phone}
              onChangeText={t => set('phone')(t.replace(/\D/g,'').slice(0,10))}
              keyboardType="phone-pad" />
          </View>
        ) : (
          <TextInput style={inp[0]} placeholder="Email address" placeholderTextColor={c.textMuted}
            value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        )}

        {/* Email for signup */}
        {mode==='signup' && (
          <TextInput style={inp[0]} placeholder="Email (optional)" placeholderTextColor={c.textMuted}
            value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        )}

        {/* Password */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:14 }}>
          <TextInput style={[inp[0],{flex:1,marginBottom:0}]} placeholder="Password"
            placeholderTextColor={c.textMuted} value={form.password} onChangeText={set('password')}
            secureTextEntry={!showPass} autoCapitalize="none" />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding:8 }}>
            <Text style={{ fontSize:20 }}>{showPass?'🙈':'👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Provider fields */}
        {mode==='signup' && role==='PROVIDER' && (
          <View style={{ backgroundColor:`${c.primary}10`, borderRadius:14, padding:14, marginBottom:14, borderWidth:1, borderColor:`${c.primary}33` }}>
            <Text style={{ color:c.primary, fontWeight:'700', marginBottom:10 }}>🔧 Provider Details</Text>
            <TextInput style={inp[0]} placeholder="Service Type (e.g. Plumber)"
              placeholderTextColor={c.textMuted} value={form.serviceType} onChangeText={set('serviceType')} />
            <TextInput style={[inp[0],{height:80}]} placeholder="Description (optional)"
              placeholderTextColor={c.textMuted} value={form.description} onChangeText={set('description')} multiline />
            <TextInput style={inp[0]} placeholder="Price per unit (e.g. ₹300/visit)"
              placeholderTextColor={c.textMuted} value={form.pricePerUnit} onChangeText={set('pricePerUnit')} />
          </View>
        )}

        {/* Forgot password */}
        {mode==='login' && (
          <TouchableOpacity onPress={() => setForgotModal(true)} style={{ alignSelf:'flex-end', marginBottom:16 }}>
            <Text style={{ color:c.primary, fontWeight:'600', fontSize:13 }}>🔑 Forgot Password?</Text>
          </TouchableOpacity>
        )}

        {/* Submit */}
        <TouchableOpacity onPress={submit} disabled={loading}
          style={{ backgroundColor:c.primary, borderRadius:14, padding:16, alignItems:'center', opacity:loading?0.7:1 }}>
          {loading ? <ActivityIndicator color="#fff" />
            : <Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>
                {mode==='login'?'🚀 Login':'✅ Create Account'}
              </Text>}
        </TouchableOpacity>

        {/* Switch mode link */}
        <TouchableOpacity onPress={() => setMode(mode==='login'?'signup':'login')}
          style={{ flexDirection:'row', justifyContent:'center', marginTop:20 }}>
          <Text style={{ color:c.textMuted }}>
            {mode==='login'?"Don't have an account? ":"Already have an account? "}
          </Text>
          <Text style={{ color:c.primary, fontWeight:'700' }}>
            {mode==='login'?'Register Now':'Login'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Forgot Password Modal ── */}
      <Modal visible={forgotModal} animationType="slide" transparent onRequestClose={closeForgot}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:c.card, borderTopLeftRadius:26, borderTopRightRadius:26, padding:24, paddingBottom:40, borderTopWidth:1, borderTopColor:c.border }}>

            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <View>
                <Text style={{ color:c.text, fontSize:22, fontWeight:'800' }}>🔑 Forgot Password</Text>
                <Text style={{ color:c.textMuted, fontSize:13, marginTop:4 }}>
                  {forgotStep===1?'Enter registered email':forgotStep===2?'Enter OTP':'Set new password'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeForgot}>
                <Text style={{ fontSize:26, color:c.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Step indicators */}
            <View style={{ flexDirection:'row', justifyContent:'center', alignItems:'center', marginBottom:20, gap:6 }}>
              {[1,2,3].map(n => (
                <View key={n} style={{ flexDirection:'row', alignItems:'center' }}>
                  <View style={{ width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center',
                    backgroundColor:forgotStep>=n?c.primary:c.border }}>
                    <Text style={{ color:'#fff', fontWeight:'800', fontSize:13 }}>{n}</Text>
                  </View>
                  {n<3&&<View style={{ width:40, height:2, backgroundColor:forgotStep>n?c.primary:c.border, marginHorizontal:4 }} />}
                </View>
              ))}
            </View>

            {/* Step 1 */}
            {forgotStep===1 && (
              <View>
                <Text style={{ color:c.text, fontWeight:'600', marginBottom:8 }}>Registered Email</Text>
                <TextInput style={inp[0]} placeholder="Enter email" placeholderTextColor={c.textMuted}
                  value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" autoCapitalize="none" />
                <TouchableOpacity onPress={sendOtp} disabled={forgotLoading}
                  style={{ backgroundColor:c.primary, borderRadius:14, padding:16, alignItems:'center', opacity:forgotLoading?0.7:1 }}>
                  {forgotLoading ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color:'#fff', fontWeight:'700' }}>📨 Send OTP</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2 */}
            {forgotStep===2 && (
              <View>
                <View style={{ backgroundColor:`${c.primary}15`, borderRadius:12, padding:12, marginBottom:14 }}>
                  <Text style={{ color:c.primary, fontSize:13 }}>✉️ OTP sent to {forgotEmail}</Text>
                </View>
                <Text style={{ color:c.text, fontWeight:'600', marginBottom:8 }}>Enter 6-digit OTP</Text>
                <TextInput style={[inp[0],{fontSize:28, letterSpacing:10, textAlign:'center', fontWeight:'800'}]}
                  placeholder="------" placeholderTextColor={c.border}
                  value={otp} onChangeText={t => setOtp(t.replace(/\D/g,'').slice(0,6))} keyboardType="number-pad" />
                <TouchableOpacity onPress={verifyOtp}
                  style={{ backgroundColor:c.primary, borderRadius:14, padding:16, alignItems:'center' }}>
                  <Text style={{ color:'#fff', fontWeight:'700' }}>✅ Verify OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={sendOtp} style={{ alignItems:'center', padding:12 }}>
                  <Text style={{ color:c.primary, fontWeight:'600' }}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3 */}
            {forgotStep===3 && (
              <View>
                <Text style={{ color:c.text, fontWeight:'600', marginBottom:8 }}>New Password</Text>
                <TextInput style={inp[0]} placeholder="Min 6 characters" placeholderTextColor={c.textMuted}
                  value={newPass} onChangeText={setNewPass} secureTextEntry />
                <Text style={{ color:c.text, fontWeight:'600', marginBottom:8 }}>Confirm New Password</Text>
                <TextInput style={[inp[0], confirmPass&&newPass!==confirmPass&&{borderColor:'#EF4444'}, confirmPass&&newPass===confirmPass&&{borderColor:c.success}]}
                  placeholder="Re-enter password" placeholderTextColor={c.textMuted}
                  value={confirmPass} onChangeText={setConfirmPass} secureTextEntry />
                {confirmPass&&newPass===confirmPass&&<Text style={{ color:c.success, fontSize:12, marginBottom:8 }}>✅ Passwords match</Text>}
                <TouchableOpacity onPress={resetPassword} disabled={forgotLoading}
                  style={{ backgroundColor:c.success, borderRadius:14, padding:16, alignItems:'center', opacity:forgotLoading?0.7:1 }}>
                  {forgotLoading ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color:'#fff', fontWeight:'700' }}>🔐 Reset Password</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
