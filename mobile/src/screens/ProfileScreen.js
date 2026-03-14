import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Switch, Image,
  Platform, Linking, Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { setUser, logout } from '../store/authSlice';
import { useLocation } from '../hooks/useLocation';
import { useAppTheme } from '../context/AppThemeContext';
import api, { FRONTEND_URL } from '../api/index';
import { SERVICES } from '../constants';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { address } = useLocation();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const c = colors;

  const [editing, setEditing]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Form fields — synced from user every time user changes
  const [photo, setPhoto]               = useState(user?.photoUri || null);
  const [name, setName]                 = useState(user?.name || '');
  const [email, setEmail]               = useState(user?.email || '');
  const [serviceType, setServiceType]   = useState(user?.serviceType || user?.providerProfile?.serviceType || '');
  const [pricePerUnit, setPricePerUnit] = useState(user?.pricePerUnit || user?.providerProfile?.pricePerUnit || '');
  const [description, setDescription]  = useState(user?.description || user?.providerProfile?.description || '');

  // Re-sync form whenever user object changes (e.g. after login, role switch)
  useEffect(() => {
    setPhoto(user?.photoUri || null);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setServiceType(user?.serviceType || user?.providerProfile?.serviceType || '');
    setPricePerUnit(user?.pricePerUnit || user?.providerProfile?.pricePerUnit || '');
    setDescription(user?.description || user?.providerProfile?.description || '');
  }, [user]);

  const isProvider = user?.role === 'PROVIDER' || user?.role === 'BOTH';
  const avatarColors = ['#FF5722','#2196F3','#4CAF50','#9C27B0','#FF9800','#00BCD4'];
  const avatarColor  = avatarColors[(user?.name?.charCodeAt(0) || 0) % avatarColors.length];
  const initials     = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

  const pickPhoto = () => {
    Alert.alert('Change Profile Photo', 'Choose a source', [
      { text: '📷 Take Photo', onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Camera permission needed'); return; }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing:true, aspect:[1,1], quality:0.7 });
        if (!result.canceled) {
          const uri = result.assets[0].uri;
          setPhoto(uri);
          dispatch(setUser({ ...user, photoUri: uri }));
        }
      }},
      { text: '🖼️ Choose from Gallery', onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Gallery permission needed'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing:true, aspect:[1,1], quality:0.7 });
        if (!result.canceled) {
          const uri = result.assets[0].uri;
          setPhoto(uri);
          dispatch(setUser({ ...user, photoUri: uri }));
        }
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saveProfile = async () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    try {
      // Save personal info
      await api.put('/api/users/profile', { name: name.trim(), email: email.trim() }).catch(() => {});

      // Save provider details if provider
      if (isProvider && (serviceType || pricePerUnit)) {
        await api.put('/api/providers/profile', {
          serviceType: serviceType.trim(),
          pricePerUnit: pricePerUnit.trim(),
          description: description.trim(),
        }).catch(() => {});
      }

      // Update Redux + AsyncStorage with ALL fields
      const updated = {
        ...user,
        name:         name.trim(),
        email:        email.trim(),
        photoUri:     photo,
        serviceType:  serviceType.trim(),
        pricePerUnit: pricePerUnit.trim(),
        description:  description.trim(),
        // also update nested providerProfile if it exists
        providerProfile: user?.providerProfile ? {
          ...user.providerProfile,
          serviceType:  serviceType.trim(),
          pricePerUnit: pricePerUnit.trim(),
          description:  description.trim(),
        } : undefined,
      };
      dispatch(setUser(updated)); // setUser now persists to AsyncStorage automatically

      setEditing(false);
      Alert.alert('✅ Saved', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', 'Could not save. Changes saved locally.');
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    // Reset form to current user values
    setName(user?.name || '');
    setEmail(user?.email || '');
    setServiceType(user?.serviceType || user?.providerProfile?.serviceType || '');
    setPricePerUnit(user?.pricePerUnit || user?.providerProfile?.pricePerUnit || '');
    setDescription(user?.description || user?.providerProfile?.description || '');
    setEditing(false);
  };

  const switchRole = () => {
    const newRole = isProvider ? 'USER' : 'PROVIDER';
    Alert.alert(
      isProvider ? '👤 Switch to User' : '🧰 Switch to Provider',
      isProvider ? 'Stop receiving job requests?' : 'Start accepting jobs and earn money?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: async () => {
          setSwitchingRole(true);
          await api.put('/api/users/role', { role: newRole }).catch(() => {});
          dispatch(setUser({ ...user, role: newRole }));
          setSwitchingRole(false);
          Alert.alert('✅ Done', `Switched to ${newRole} mode!`);
        }},
      ]
    );
  };

  const Field = ({ label, value, displayValue, onChangeText, keyboardType, placeholder, multiline }) => (
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:11, borderBottomWidth:1, borderBottomColor:c.border }}>
      <Text style={{ color:c.textMuted, fontSize:13, fontWeight:'600', minWidth:80 }}>{label}</Text>
      {editing && onChangeText ? (
        <TextInput
          style={{ flex:1, color:c.text, fontSize:13, textAlign:'right', backgroundColor:`${c.primary}12`, borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginLeft:10, minHeight: multiline?60:undefined }}
          value={value} onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          placeholder={placeholder || ''}
          placeholderTextColor={c.border}
          multiline={multiline}
        />
      ) : (
        <Text style={{ color: displayValue ? c.text : '#EF4444', fontSize:13, flex:1, textAlign:'right', marginLeft:10 }} numberOfLines={2}>
          {displayValue || value || <Text style={{ color:'#EF4444' }}>Not set</Text>}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={{ flex:1, backgroundColor:c.bg }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:20, paddingTop:56 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width:36, height:36, borderRadius:10, backgroundColor:c.card, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:c.border }}>
          <Text style={{ color:c.text, fontSize:20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color:c.text, fontSize:18, fontWeight:'800' }}>My Profile</Text>
        <View style={{ flexDirection:'row', gap:8 }}>
          {editing && (
            <TouchableOpacity onPress={cancelEdit}
              style={{ backgroundColor:`${c.danger}18`, borderRadius:10, paddingHorizontal:12, paddingVertical:7, borderWidth:1, borderColor:`${c.danger}44` }}>
              <Text style={{ color:c.danger, fontWeight:'700', fontSize:13 }}>✕ Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => editing ? saveProfile() : setEditing(true)}
            style={{ backgroundColor:`${c.primary}22`, borderRadius:10, paddingHorizontal:14, paddingVertical:7, borderWidth:1, borderColor:`${c.primary}44` }}>
            {saving
              ? <ActivityIndicator size="small" color={c.primary} />
              : <Text style={{ color:c.primary, fontWeight:'700', fontSize:13 }}>{editing ? '💾 Save' : '✏️ Edit'}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar */}
      <View style={{ alignItems:'center', paddingVertical:24 }}>
        <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} style={{ position:'relative' }}>
          {photo
            ? <Image source={{ uri:photo }} style={{ width:96, height:96, borderRadius:30, borderWidth:3, borderColor:c.primary }} />
            : <View style={{ width:96, height:96, borderRadius:30, backgroundColor:avatarColor, alignItems:'center', justifyContent:'center' }}>
                <Text style={{ color:'#fff', fontSize:36, fontWeight:'800' }}>{initials}</Text>
              </View>}
          <View style={{ position:'absolute', bottom:-4, right:-4, backgroundColor:c.card, borderRadius:14, padding:6, borderWidth:2, borderColor:c.bg }}>
            <Text style={{ fontSize:16 }}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={{ color:c.text, fontSize:20, fontWeight:'800', marginTop:14 }}>{user?.name || '—'}</Text>
        <Text style={{ color:c.textMuted, fontSize:11, marginTop:3 }}>📱 {user?.phone || '—'}</Text>
        <View style={{ marginTop:10, paddingHorizontal:14, paddingVertical:5, borderRadius:20,
          backgroundColor: isProvider ? '#FF572222' : '#2196F322',
          borderWidth:1, borderColor: isProvider ? '#FF572244' : '#2196F344' }}>
          <Text style={{ fontWeight:'700', fontSize:13, color: isProvider ? '#FF5722' : '#2196F3' }}>
            {isProvider ? '🧰 Provider' : '👤 User'}
          </Text>
        </View>
      </View>

      {/* Role Switch */}
      <View style={{ backgroundColor:c.card, borderRadius:18, marginHorizontal:20, marginBottom:14, padding:16, borderWidth:1, borderColor:c.border }}>
        <View style={{ flexDirection:'row', alignItems:'center' }}>
          <View style={{ flex:1 }}>
            <Text style={{ color:c.text, fontWeight:'700', fontSize:14 }}>{isProvider ? '🧰 Provider Mode Active' : '👤 User Mode Active'}</Text>
            <Text style={{ color:c.textMuted, fontSize:12, marginTop:3 }}>{isProvider ? 'You receive & accept job requests' : 'Switch to offer services & earn money'}</Text>
          </View>
          {switchingRole
            ? <ActivityIndicator color={c.primary} />
            : <Switch value={isProvider} onValueChange={switchRole} trackColor={{ true:c.primary, false:c.border }} thumbColor="#fff" />}
        </View>
      </View>

      {/* Theme */}
      <View style={{ backgroundColor:c.card, borderRadius:18, marginHorizontal:20, marginBottom:14, padding:16, borderWidth:1, borderColor:c.border }}>
        <View style={{ flexDirection:'row', alignItems:'center' }}>
          <View style={{ flex:1 }}>
            <Text style={{ color:c.text, fontWeight:'700', fontSize:14 }}>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</Text>
            <Text style={{ color:c.textMuted, fontSize:12, marginTop:3 }}>Tap to toggle theme</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true:'#6366F1', false:'#F59E0B' }} thumbColor="#fff" />
        </View>
      </View>

      {/* Personal Info */}
      <View style={{ backgroundColor:c.card, borderRadius:18, marginHorizontal:20, marginBottom:14, padding:16, borderWidth:1, borderColor:c.border }}>
        <Text style={{ color:c.text, fontWeight:'700', fontSize:14, marginBottom:4 }}>👤 Personal Info</Text>
        {editing && <Text style={{ color:c.textMuted, fontSize:11, marginBottom:12 }}>Tap a field to edit it</Text>}
        <Field label="Full Name" value={name} displayValue={user?.name} onChangeText={setName} placeholder="Your name" />
        <Field label="📱 Phone"  value={user?.phone} displayValue={user?.phone} />
        <Field label="📧 Email"  value={email} displayValue={user?.email} onChangeText={setEmail} keyboardType="email-address" placeholder="your@email.com" />
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:11 }}>
          <Text style={{ color:c.textMuted, fontSize:13, fontWeight:'600' }}>📍 Location</Text>
          <Text style={{ color:c.text, fontSize:12, flex:1, textAlign:'right', marginLeft:10 }} numberOfLines={2}>{address || 'Getting...'}</Text>
        </View>
      </View>

      {/* Provider Details */}
      {isProvider && (
        <View style={{ backgroundColor:c.card, borderRadius:18, marginHorizontal:20, marginBottom:14, padding:16, borderWidth:1, borderColor:c.border }}>
          <Text style={{ color:c.text, fontWeight:'700', fontSize:14, marginBottom:4 }}>🧰 Provider Details</Text>
          {editing && <Text style={{ color:c.textMuted, fontSize:11, marginBottom:12 }}>Fill these so customers can find you</Text>}

          <Field label="Service"     value={serviceType}  displayValue={serviceType}  onChangeText={setServiceType}  placeholder="e.g. Plumber" />
          <Field label="Price"       value={pricePerUnit} displayValue={pricePerUnit} onChangeText={setPricePerUnit} placeholder="e.g. ₹300/visit" />
          <Field label="Description" value={description}  displayValue={description}  onChangeText={setDescription}  placeholder="Tell customers about yourself" multiline />

          {editing && (
            <>
              <Text style={{ color:c.textMuted, fontSize:12, fontWeight:'600', marginTop:14, marginBottom:10 }}>Or pick a category:</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                {SERVICES.map(sv => (
                  <TouchableOpacity key={sv.id} onPress={() => setServiceType(sv.id)}
                    style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:6, borderRadius:20,
                      backgroundColor: serviceType===sv.id ? `${sv.color}22` : c.bg,
                      borderWidth:1, borderColor: serviceType===sv.id ? sv.color : c.border }}>
                    <Text style={{ fontSize:14 }}>{sv.icon}</Text>
                    <Text style={{ color: serviceType===sv.id ? sv.color : c.textMuted, fontSize:11, fontWeight:'600' }}>{sv.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* Stats */}
      {isProvider && (
        <View style={{ flexDirection:'row', gap:10, marginHorizontal:20, marginBottom:14 }}>
          {[{ icon:'⭐', label:'Rating', val: user?.rating || '5.0' },
            { icon:'✅', label:'Jobs',   val: user?.totalOrders || '0' },
            { icon:'💰', label:'Earned', val: `₹${user?.earnings || 0}` }].map(st => (
            <View key={st.label} style={{ flex:1, backgroundColor:c.card, borderRadius:14, padding:14, alignItems:'center', borderWidth:1, borderColor:c.border }}>
              <Text style={{ fontSize:22 }}>{st.icon}</Text>
              <Text style={{ color:c.text, fontWeight:'800', fontSize:16, marginTop:6 }}>{st.val}</Text>
              <Text style={{ color:c.textMuted, fontSize:11, marginTop:2 }}>{st.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Share App Card */}
      <View style={{ backgroundColor:c.card, borderRadius:18, marginHorizontal:20, marginBottom:14, padding:16, borderWidth:1, borderColor:c.border }}>
        <Text style={{ color:c.text, fontWeight:'700', fontSize:14, marginBottom:12 }}>🔗 App Link</Text>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'web') {
              navigator.clipboard?.writeText(FRONTEND_URL);
              Alert.alert('✅ Copied!', 'App link copied to clipboard!\n\n' + FRONTEND_URL);
            } else {
              Share.share({ message: 'Use HeyMate — One App, Any Task, Any Time!\n\n' + FRONTEND_URL, url: FRONTEND_URL });
            }
          }}
          style={{ backgroundColor:`${c.primary}15`, borderRadius:12, padding:14, borderWidth:1, borderColor:`${c.primary}33`, marginBottom:10 }}>
          <Text style={{ color:c.textMuted, fontSize:11, marginBottom:4 }}>🌐 Web App URL</Text>
          <Text style={{ color:c.primary, fontSize:13, fontWeight:'700' }} numberOfLines={1}>{FRONTEND_URL}</Text>
          <Text style={{ color:c.textMuted, fontSize:11, marginTop:6 }}>Tap to copy • Share with anyone • Works on all phones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL(FRONTEND_URL)}
          style={{ backgroundColor:`${c.success}15`, borderRadius:12, padding:12, borderWidth:1, borderColor:`${c.success}33`, alignItems:'center' }}>
          <Text style={{ color:c.success, fontWeight:'700', fontSize:13 }}>🚀 Open in Browser</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={{ backgroundColor:c.card, borderRadius:18, marginHorizontal:20, marginBottom:14, padding:16, borderWidth:1, borderColor:c.border }}>
        <Text style={{ color:c.text, fontWeight:'700', fontSize:14, marginBottom:14 }}>⚙️ Settings</Text>
        {[
          { icon:'🔔', label:'Notifications', sub:'Manage alerts & sounds',    screen:'NotificationSettings' },
          { icon:'🛡️', label:'Privacy & Safety', sub:'She-Safe, trusted contacts', screen:'Emergency' },
          { icon:'❓', label:'Help & Support',  sub:'FAQs, contact us',         screen:'HelpSupport' },
          { icon:'⭐', label:'Rate HeyMate',    sub:'Tell us what you think',   screen:'RateApp' },
        ].map((item, i, arr) => (
          <TouchableOpacity key={item.label}
            style={{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, borderBottomWidth: i<arr.length-1 ? 1:0, borderBottomColor:c.border }}
            onPress={() => navigation.navigate(item.screen)}>
            <Text style={{ fontSize:22 }}>{item.icon}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:c.text, fontSize:14, fontWeight:'600' }}>{item.label}</Text>
              <Text style={{ color:c.textMuted, fontSize:11, marginTop:2 }}>{item.sub}</Text>
            </View>
            <Text style={{ color:c.border, fontSize:18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={{ backgroundColor:'#EF444418', borderRadius:14, padding:16, alignItems:'center', marginHorizontal:20, marginBottom:12, borderWidth:1, borderColor:'#EF444433' }}
        onPress={() => Alert.alert('Logout', 'Are you sure?', [
          { text:'Cancel', style:'cancel' },
          { text:'Logout', style:'destructive', onPress: () => dispatch(logout()) },
        ])}>
        <Text style={{ color:'#EF4444', fontWeight:'700', fontSize:15 }}>🚪 Logout</Text>
      </TouchableOpacity>

      <Text style={{ color:c.textMuted, fontSize:11, textAlign:'center', marginBottom:8 }}>HeyMate v1.0.0</Text>
      <View style={{ height:80 }} />
    </ScrollView>
  );
}