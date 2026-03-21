import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Platform, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const SERVICES = [
  { id: 'food',        icon: '🍔', label: 'Food',        color: '#FF6B35' },
  { id: 'grocery',     icon: '🛒', label: 'Grocery',     color: '#4CAF50' },
  { id: 'transport',   icon: '🚗', label: 'Cab / Auto',  color: '#2196F3' },
  { id: 'carpenter',   icon: '🔨', label: 'Carpenter',   color: '#795548' },
  { id: 'plumber',     icon: '🔧', label: 'Plumber',     color: '#607D8B' },
  { id: 'electrician', icon: '⚡', label: 'Electrician', color: '#FFC107' },
  { id: 'tutor',       icon: '📚', label: 'Tutor',       color: '#00BCD4' },
  { id: 'salon',       icon: '💇', label: 'Salon',       color: '#E91E63' },
  { id: 'hospital',    icon: '🏥', label: 'Hospital',    color: '#F44336' },
  { id: 'pharmacy',    icon: '💊', label: 'Pharmacy',    color: '#009688' },
  { id: 'shopping',    icon: '🛍️', label: 'Shopping',    color: '#9C27B0' },
  { id: 'laundry',     icon: '👕', label: 'Laundry',     color: '#3F51B5' },
  { id: 'household',   icon: '🏠', label: 'Home Help',   color: '#FF9800' },
  { id: 'stationary',  icon: '✏️', label: 'Stationery',  color: '#607D8B' },
  { id: 'events',      icon: '🎉', label: 'Events',      color: '#E91E63' },
  { id: 'blood',       icon: '🩸', label: 'Blood',       color: '#D32F2F' },
  { id: 'women',       icon: '🛡️', label: 'She-Safe',   color: '#AD1457' },
  { id: 'fitness',     icon: '💪', label: 'Fitness',     color: '#FF5722' },
  { id: 'mechanic',    icon: '🔩', label: 'Mechanic',    color: '#546E7A' },
  { id: 'petcare',     icon: '🐾', label: 'Pet Care',    color: '#8BC34A' },
];

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('token');
  const AS = (await import('@react-native-async-storage/async-storage')).default;
  return AS.getItem('token');
};

export default function HomeScreen({ navigation }) {
  const { user }    = useSelector(s => s.auth);
  const [search, setSearch]   = useState('');
  const [address, setAddress] = useState('Getting location...');
  const [liveLocation, setLiveLocation] = useState(false);

  useEffect(() => {
    // Get location
    if (Platform.OS === 'web') {
      navigator.geolocation?.getCurrentPosition(
        async pos => {
          setLiveLocation(true);
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
            );
            const data = await res.json();
            setAddress(data.display_name?.split(',').slice(0, 3).join(', ') || 'Chennai, Tamil Nadu');
          } catch { setAddress('Chennai, Tamil Nadu'); }
        },
        () => setAddress('Chennai, Tamil Nadu')
      );
    } else {
      setAddress('Chennai, Tamil Nadu');
      setLiveLocation(true);
    }
  }, []);

  const filtered = SERVICES.filter(s =>
    !search || s.label.toLowerCase().includes(search.toLowerCase())
  );

  const goToService = (service) => {
    if (service.id === 'women' || service.id === 'blood') {
      navigation.navigate('Emergency'); return;
    }
    navigation.navigate('ServiceProviders', {
      category: service.label,
      icon: service.icon,
      color: service.color,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F5F5F5' }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ backgroundColor: '#FFFFFF', paddingTop: 52,
        paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#888', fontSize: 13, fontStyle: 'italic' }}>
              Welcome back 👋
            </Text>
            <Text style={{ color: '#1A1A1A', fontSize: 26, fontWeight: '900',
              fontStyle: 'italic', letterSpacing: 0.5 }}>
              {(user?.name || 'Hello').toUpperCase()}!
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}
            style={{ width: 44, height: 44, borderRadius: 22,
              backgroundColor: '#4A90D9', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, color: '#fff' }}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Bar */}
      <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
        borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <Text style={{ fontSize: 20, marginRight: 10, marginTop: 2 }}>📍</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text style={{ color: '#888', fontSize: 10, fontWeight: '700',
              letterSpacing: 1, textTransform: 'uppercase' }}>Your Location</Text>
          </View>
          <Text style={{ color: '#1A1A1A', fontSize: 13, fontWeight: '600', lineHeight: 20 }}
            numberOfLines={2}>{address}</Text>
        </View>
        {liveLocation && (
          <View style={{ backgroundColor: '#E8F5E9', borderRadius: 20,
            paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row',
            alignItems: 'center', gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50' }} />
            <Text style={{ color: '#4CAF50', fontSize: 11, fontWeight: '700' }}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
        borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <Text style={{ fontSize: 18, marginRight: 10 }}>🔍</Text>
        <TextInput
          style={{ flex: 1, paddingVertical: 14, fontSize: 14, color: '#333' }}
          placeholder="Search any service..."
          placeholderTextColor="#AAA"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Emergency Banner */}
      <TouchableOpacity onPress={() => navigation.navigate('Emergency')}
        style={{ backgroundColor: '#D32F2F', marginHorizontal: 16, marginTop: 12,
          borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#B71C1C',
          alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <Text style={{ fontSize: 22 }}>🆘</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Emergency Services</Text>
          <Text style={{ color: '#ffaaaa', fontSize: 12, marginTop: 2 }}>
            Blood Donors · She-Safe · Ambulance · Police
          </Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20 }}>›</Text>
      </TouchableOpacity>

      {/* She-Safe Banner */}
      <TouchableOpacity onPress={() => navigation.navigate('Emergency')}
        style={{ backgroundColor: '#880E4F', marginHorizontal: 16, marginTop: 10,
          borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#6A0136',
          alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <Text style={{ fontSize: 22 }}>🛡️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>She-Safe Mode</Text>
          <Text style={{ color: '#f8bbd0', fontSize: 12, marginTop: 2 }}>
            SOS Alert · Live Location Share · Trusted Contacts
          </Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20 }}>›</Text>
      </TouchableOpacity>

      {/* All Services */}
      <Text style={{ color: '#1A1A1A', fontSize: 18, fontWeight: '800',
        marginHorizontal: 20, marginTop: 20, marginBottom: 14 }}>
        All Services
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: 12, gap: 8, marginBottom: 20 }}>
        {filtered.map(service => (
          <TouchableOpacity
            key={service.id}
            onPress={() => goToService(service)}
            style={{ width: '22%', backgroundColor: '#FFFFFF', borderRadius: 18,
              padding: 12, alignItems: 'center',
              shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 16,
              backgroundColor: `${service.color}18`,
              alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 30 }}>{service.icon}</Text>
            </View>
            <Text style={{ color: '#333', fontSize: 10, fontWeight: '600',
              marginTop: 8, textAlign: 'center' }} numberOfLines={2}>
              {service.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}
