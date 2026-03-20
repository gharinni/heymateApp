import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useSelector } from 'react-redux';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const CATEGORIES = [
  { id: '1',  name: 'Plumbing',      icon: '🔧', color: '#007AFF' },
  { id: '2',  name: 'Electrical',    icon: '⚡', color: '#FF9500' },
  { id: '3',  name: 'Cleaning',      icon: '🏠', color: '#34C759' },
  { id: '4',  name: 'Painting',      icon: '🎨', color: '#FF3B30' },
  { id: '5',  name: 'Carpentry',     icon: '🔨', color: '#8E8E93' },
  { id: '6',  name: 'AC Repair',     icon: '❄️', color: '#5AC8FA' },
  { id: '7',  name: 'Car Wash',      icon: '🚗', color: '#007AFF' },
  { id: '8',  name: 'Moving',        icon: '📦', color: '#FF9500' },
  { id: '9',  name: 'Salon',         icon: '💇', color: '#FF2D55' },
  { id: '10', name: 'Pet Care',      icon: '🐾', color: '#34C759' },
  { id: '11', name: 'Tutoring',      icon: '📚', color: '#5856D6' },
  { id: '12', name: 'Food Delivery', icon: '🍔', color: '#FF3B30' },
  { id: '13', name: 'Women Safety',  icon: '🛡️', color: '#FF2D55' },
  { id: '14', name: 'Blood Donor',   icon: '🩸', color: '#FF3B30' },
  { id: '15', name: 'Transport',     icon: '🚗', color: '#2196F3' },
  { id: '16', name: 'Mechanic',      icon: '🔩', color: '#546E7A' },
  { id: '17', name: 'Grocery',       icon: '🛒', color: '#4CAF50' },
  { id: '18', name: 'Laundry',       icon: '👕', color: '#3F51B5' },
  { id: '19', name: 'Fitness',       icon: '💪', color: '#FF5722' },
  { id: '20', name: 'Pharmacy',      icon: '💊', color: '#009688' },
];

const C = {
  bg: '#0D0D1A', card: '#1A1A2E', primary: '#FF5722',
  text: '#FFFFFF', textMuted: '#9CA3AF', border: '#2A2A3E',
  success: '#4CAF50',
};

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('token');
  const AS = (await import('@react-native-async-storage/async-storage')).default;
  return AS.getItem('token');
};

export default function HomeScreen({ navigation }) {
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading]     = useState(false);
  const [providers, setProviders] = useState([]);
  const [selected, setSelected]   = useState(null);

  const fetchProviders = async (category) => {
    setSelected(category);
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${BACKEND}/providers/nearby?category=${category}&latitude=13.0827&longitude=80.2707&radius=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setProviders(data?.data || data || []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: C.textMuted, fontSize: 13 }}>Welcome back 👋</Text>
        <Text style={{ color: C.text, fontSize: 26, fontWeight: '800', marginTop: 4 }}>
          {user?.name?.split(' ')[0] || 'Hello'}!
        </Text>
        <Text style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>
          What service do you need today?
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Request')}
          style={{ flex: 1, backgroundColor: C.primary, borderRadius: 16,
            padding: 16, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 24 }}>📋</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginTop: 6 }}>
            Post Request
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('NearbyMap')}
          style={{ flex: 1, backgroundColor: C.card, borderRadius: 16,
            padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border }}
        >
          <Text style={{ fontSize: 24 }}>🗺️</Text>
          <Text style={{ color: C.text, fontWeight: '700', fontSize: 13, marginTop: 6 }}>
            Nearby Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Emergency')}
          style={{ flex: 1, backgroundColor: '#1a0000', borderRadius: 16,
            padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' }}
        >
          <Text style={{ fontSize: 24 }}>🆘</Text>
          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13, marginTop: 6 }}>
            Emergency
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={{ color: C.text, fontSize: 18, fontWeight: '800',
        paddingHorizontal: 20, marginBottom: 14 }}>
        Browse Services
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => {
              fetchProviders(cat.name);
              navigation.navigate('Request', { category: cat.name });
            }}
            style={{
              width: '22%', backgroundColor: C.card, borderRadius: 16,
              padding: 12, alignItems: 'center', borderWidth: 1,
              borderColor: selected === cat.name ? cat.color : C.border,
            }}
          >
            <Text style={{ fontSize: 28 }}>{cat.icon}</Text>
            <Text style={{ color: C.text, fontSize: 10, fontWeight: '600',
              marginTop: 6, textAlign: 'center' }} numberOfLines={2}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nearby Providers */}
      {selected && (
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>
            {selected} Providers Nearby
          </Text>
          {loading ? (
            <ActivityIndicator color={C.primary} />
          ) : providers.length === 0 ? (
            <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 20,
              alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={{ color: C.text, fontWeight: '600', marginTop: 8 }}>
                No providers found nearby
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Request', { category: selected })}
                style={{ backgroundColor: C.primary, borderRadius: 12,
                  padding: 12, marginTop: 12, paddingHorizontal: 24 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Post a Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            providers.slice(0, 5).map((p, i) => (
              <View key={i} style={{ backgroundColor: C.card, borderRadius: 14,
                padding: 14, marginBottom: 10, flexDirection: 'row',
                alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                <View style={{ width: 48, height: 48, borderRadius: 24,
                  backgroundColor: `${C.primary}20`, alignItems: 'center',
                  justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 24 }}>👷</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>
                    {p.user?.name || p.name || 'Provider'}
                  </Text>
                  <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>
                    ⭐ {p.rating || '5.0'} · {p.category || selected}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Request', { category: selected })}
                  style={{ backgroundColor: C.primary, borderRadius: 10,
                    paddingHorizontal: 14, paddingVertical: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Book</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}
