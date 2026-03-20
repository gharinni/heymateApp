import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { Platform } from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';

const DEFAULTS = {
  maxDistance:3, maxTravelTime:10, autoExpand:true,
  showDistance:true, showTravelTime:true, showRatings:true, showOpenOnly:false,
  minRating:0, sortBy:'distance',
  preferGooglePlaces:true, useOSMFallback:true,
  useHighAccuracy:true, locationCacheTime:5,
  notifyNewShops:false, notifyPriceChanges:false,
};

export default function NearbySettingsScreen({ navigation }) {
  const { colors: c } = useAppTheme();
  const [s, setS]   = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('nearbySettings').then(v => {
      if (v) setS({ ...DEFAULTS, ...JSON.parse(v) });
      setLoading(false);
    });
  }, []);

  const set = (key, val) => setS(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    await AsyncStorage.setItem('nearbySettings', JSON.stringify({ ...s, updatedAt:new Date().toISOString() }));
    setSaving(false);
    Alert.alert('✅ Saved!','Settings saved.',[{ text:'OK', onPress:()=>navigation.goBack() }]);
  };

  const reset = () => Alert.alert('Reset?','Reset all to defaults?',[
    { text:'Cancel', style:'cancel' },
    { text:'Reset', style:'destructive', onPress: () => { setS(DEFAULTS); Alert.alert('Reset!','Settings reset.'); } },
  ]);

  const Row = ({ label, sub, rightKey, rightType='switch', options, value, onChange }) => (
    <View style={{ paddingVertical:14, borderBottomWidth:1, borderBottomColor:c.border }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <View style={{ flex:1, marginRight:10 }}>
          <Text style={{ color:c.text, fontSize:14, fontWeight:'600' }}>{label}</Text>
          {sub&&<Text style={{ color:c.textMuted, fontSize:12, marginTop:2 }}>{sub}</Text>}
        </View>
        {rightType==='switch'&&(
          <Switch value={value} onValueChange={onChange}
            trackColor={{ false:c.border, true:c.primary }} thumbColor="#fff" />
        )}
        {rightType==='value'&&<Text style={{ color:c.primary, fontWeight:'700', fontSize:14 }}>{value}</Text>}
      </View>
      {options&&(
        <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
          {options.map(o => (
            <TouchableOpacity key={o.v} onPress={() => onChange(o.v)}
              style={{ flex:1, paddingVertical:8, borderRadius:10, alignItems:'center', borderWidth:1.5,
                borderColor:value===o.v?c.primary:c.border,
                backgroundColor:value===o.v?`${c.primary}18`:c.bg }}>
              <Text style={{ color:value===o.v?c.primary:c.textMuted, fontWeight:'700', fontSize:12 }}>{o.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) return <View style={{ flex:1, backgroundColor:c.bg, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={c.primary} /></View>;

  return (
    <View style={{ flex:1, backgroundColor:c.bg }}>
      <View style={{ padding:20, paddingTop:56, flexDirection:'row', alignItems:'center', gap:12, borderBottomWidth:1, borderBottomColor:c.border, backgroundColor:c.card }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width:36, height:36, borderRadius:10, backgroundColor:c.bg, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:c.border }}>
          <Text style={{ color:c.text, fontSize:20 }}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ color:c.text, fontSize:20, fontWeight:'800' }}>⚙️ Nearby Settings</Text>
          <Text style={{ color:c.textMuted, fontSize:12, marginTop:2 }}>Customize how you discover services</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:16, paddingBottom:60 }}>
        {[
          { title:'📍 Distance & Search', rows:[
            { label:'Max Search Distance', value:`${s.maxDistance} km`, rightType:'value',
              options:[{v:1,l:'1km'},{v:3,l:'3km'},{v:5,l:'5km'},{v:10,l:'10km'}], onChange:v=>set('maxDistance',v) },
            { label:'Max Travel Time', value:`${s.maxTravelTime} min`, rightType:'value',
              options:[{v:5,l:'5min'},{v:10,l:'10min'},{v:15,l:'15min'},{v:20,l:'20min'}], onChange:v=>set('maxTravelTime',v) },
            { label:'Auto-Expand Search', sub:'Increase radius if no results', value:s.autoExpand, onChange:v=>set('autoExpand',v) },
          ]},
          { title:'👁️ Display', rows:[
            { label:'Show Distance',     value:s.showDistance,    onChange:v=>set('showDistance',v) },
            { label:'Show Travel Time',  value:s.showTravelTime,  onChange:v=>set('showTravelTime',v) },
            { label:'Show Ratings',      value:s.showRatings,     onChange:v=>set('showRatings',v) },
            { label:'Open Shops Only',   value:s.showOpenOnly,    onChange:v=>set('showOpenOnly',v) },
          ]},
          { title:'🔍 Filters', rows:[
            { label:'Minimum Rating', value:`⭐ ${s.minRating===0?'Any':s.minRating+'+'}`, rightType:'value',
              options:[{v:0,l:'Any'},{v:3,l:'3.0+'},{v:4,l:'4.0+'},{v:4.5,l:'4.5+'}], onChange:v=>set('minRating',v) },
            { label:'Sort Results By', value:s.sortBy==='distance'?'📍 Distance':s.sortBy==='rating'?'⭐ Rating':'👥 Reviews', rightType:'value',
              options:[{v:'distance',l:'Distance'},{v:'rating',l:'Rating'},{v:'reviews',l:'Reviews'}], onChange:v=>set('sortBy',v) },
          ]},
          { title:'🌐 Data Sources', rows:[
            { label:'Prefer Google Places', sub:'Best accuracy',         value:s.preferGooglePlaces, onChange:v=>set('preferGooglePlaces',v) },
            { label:'Use OSM Fallback',     sub:'Free open-source maps', value:s.useOSMFallback,     onChange:v=>set('useOSMFallback',v) },
          ]},
          { title:'📡 Location', rows:[
            { label:'High Accuracy GPS', sub:'More accurate, more battery', value:s.useHighAccuracy, onChange:v=>set('useHighAccuracy',v) },
            { label:'Cache Time', value:`${s.locationCacheTime} min`, rightType:'value',
              options:[{v:1,l:'1min'},{v:5,l:'5min'},{v:10,l:'10min'}], onChange:v=>set('locationCacheTime',v) },
          ]},
          { title:'🔔 Notifications', rows:[
            { label:'Notify New Shops',    sub:'When new shops open nearby', value:s.notifyNewShops,    onChange:v=>set('notifyNewShops',v) },
            { label:'Price Change Alerts', sub:'Deals and discounts',        value:s.notifyPriceChanges, onChange:v=>set('notifyPriceChanges',v) },
          ]},
        ].map(section => (
          <View key={section.title} style={{ backgroundColor:c.card, borderRadius:16, padding:16, marginBottom:14, borderWidth:1, borderColor:c.border }}>
            <Text style={{ color:c.text, fontSize:16, fontWeight:'800', marginBottom:4 }}>{section.title}</Text>
            {section.rows.map(row => <Row key={row.label} {...row} />)}
          </View>
        ))}

        <View style={{ backgroundColor:`${c.success}15`, borderRadius:14, padding:14, marginBottom:20, borderWidth:1, borderColor:`${c.success}33` }}>
          <Text style={{ color:c.success, fontWeight:'700', fontSize:14, marginBottom:8 }}>💡 Tips</Text>
          <Text style={{ color:c.success, fontSize:12, lineHeight:20 }}>
            • 3-5km radius gives balanced results{'\n'}
            • Enable auto-expand to never miss options{'\n'}
            • High accuracy GPS uses more battery{'\n'}
            • Google Places has best data quality
          </Text>
        </View>

        <View style={{ flexDirection:'row', gap:12 }}>
          <TouchableOpacity onPress={reset}
            style={{ flex:1, padding:16, borderRadius:14, borderWidth:2, borderColor:'#ef4444', alignItems:'center' }}>
            <Text style={{ color:'#ef4444', fontWeight:'700' }}>Reset Defaults</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} disabled={saving}
            style={{ flex:2, padding:16, borderRadius:14, backgroundColor:c.primary, alignItems:'center', opacity:saving?0.7:1 }}>
            {saving ? <ActivityIndicator color="#fff" />
              : <Text style={{ color:'#fff', fontWeight:'800' }}>💾 Save Settings</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
