import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Platform, Linking,
} from 'react-native';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('token');
  const AS = (await import('@react-native-async-storage/async-storage')).default;
  return AS.getItem('token');
};

// Mock nearby providers sorted by rating
const MOCK = {
  Food: [
    { id:'m1', name:'Saravana Bhavan',  rating:4.9, reviews:2100, price:'₹40–₹250',  distance:'0.3 km', open:true,  phone:'9876500001', tags:['Veg','South Indian','Breakfast'] },
    { id:'m2', name:'Murugan Idli Shop',rating:4.8, reviews:1800, price:'₹50–₹200',  distance:'0.7 km', open:true,  phone:'9876500002', tags:['Veg','Tiffin','Famous'] },
    { id:'m3', name:'KFC',              rating:4.3, reviews:890,  price:'₹200–₹600', distance:'0.8 km', open:true,  phone:'9876500003', tags:['Non-Veg','Fast Food'] },
    { id:'m4', name:'Dominos Pizza',    rating:4.2, reviews:670,  price:'₹300–₹800', distance:'1.2 km', open:true,  phone:'9876500004', tags:['Pizza','Delivery'] },
    { id:'m5', name:'Hotel Vasanta Bhavan',rating:4.1,reviews:430,price:'₹60–₹300', distance:'1.5 km', open:false, phone:'9876500005', tags:['Veg','Meals'] },
  ],
  Grocery: [
    { id:'m6', name:'Big Basket',       rating:4.7, reviews:1100, price:'MRP',        distance:'0.0 km', open:true,  phone:'9876500006', tags:['Online','Delivery','Fresh'] },
    { id:'m7', name:'Nilgiris Fresh',   rating:4.5, reviews:432,  price:'MRP',        distance:'0.5 km', open:true,  phone:'9876500007', tags:['Supermarket','Organic'] },
    { id:'m8', name:'DMart',            rating:4.3, reviews:780,  price:'Wholesale',  distance:'1.4 km', open:true,  phone:'9876500008', tags:['Budget','Bulk'] },
  ],
  Plumber: [
    { id:'m9', name:'Ravi Plumber',     rating:4.8, reviews:120,  price:'₹300/visit', distance:'0.4 km', open:true,  phone:'9876500009', tags:['Pipe Repair','Leaks','Fast'] },
    { id:'m10',name:'Chennai Plumbing', rating:4.5, reviews:85,   price:'₹400/visit', distance:'1.2 km', open:true,  phone:'9876500010', tags:['Bathroom','Kitchen'] },
  ],
  Electrician: [
    { id:'m11',name:'Suresh Electric',  rating:4.7, reviews:95,   price:'₹400/visit', distance:'0.6 km', open:true,  phone:'9876500011', tags:['Wiring','Repairs','AC'] },
    { id:'m12',name:'Power Fix',        rating:4.4, reviews:60,   price:'₹350/visit', distance:'1.0 km', open:true,  phone:'9876500012', tags:['Appliances','Switches'] },
  ],
  'Cab / Auto': [
    { id:'m13',name:'Quick Cab',        rating:4.8, reviews:210,  price:'₹12/km',     distance:'0.2 km', open:true,  phone:'9876500013', tags:['AC','24hr','Outstation'] },
    { id:'m14',name:'Auto Raja',        rating:4.5, reviews:180,  price:'₹10/km',     distance:'0.3 km', open:true,  phone:'9876500014', tags:['Auto','Local'] },
    { id:'m15',name:'Ola',              rating:4.3, reviews:5000, price:'₹8–₹20/km',  distance:'0.1 km', open:true,  phone:'9876500015', tags:['App','Mini','Share'] },
  ],
  Salon: [
    { id:'m16',name:'Green Trends',     rating:4.8, reviews:520,  price:'₹300–₹3000', distance:'0.6 km', open:true,  phone:'9876500016', tags:['Hair','Spa','Premium'] },
    { id:'m17',name:'Naturals Salon',   rating:4.6, reviews:340,  price:'₹200–₹2000', distance:'1.1 km', open:true,  phone:'9876500017', tags:['Unisex','AC'] },
  ],
  Hospital: [
    { id:'m18',name:'Apollo Clinic',    rating:4.8, reviews:560,  price:'₹300 consult',distance:'0.7 km',open:true,  phone:'9876500018', tags:['Multi-specialty','24hr'] },
    { id:'m19',name:'Dr. Mehta Clinic', rating:4.6, reviews:230,  price:'₹200 consult',distance:'0.5 km',open:true,  phone:'9876500019', tags:['General','Family'] },
  ],
  Pharmacy: [
    { id:'m20',name:'Apollo Pharmacy',  rating:4.6, reviews:380,  price:'MRP',        distance:'0.8 km', open:true,  phone:'9876500020', tags:['24hr','Generic'] },
    { id:'m21',name:'MedPlus',          rating:4.4, reviews:210,  price:'MRP -10%',   distance:'0.2 km', open:true,  phone:'9876500021', tags:['All brands','Delivery'] },
  ],
};

const getMock = (cat) => {
  const key = Object.keys(MOCK).find(k =>
    k.toLowerCase() === cat?.toLowerCase() ||
    cat?.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(cat?.toLowerCase())
  );
  return (key ? MOCK[key] : [
    { id:'g1', name:`${cat} Provider 1`, rating:4.5, reviews:50, price:'₹300/visit', distance:'0.5 km', open:true,  phone:'9000000001', tags:['Professional','Experienced'] },
    { id:'g2', name:`${cat} Provider 2`, rating:4.2, reviews:30, price:'₹250/visit', distance:'1.0 km', open:true,  phone:'9000000002', tags:['Trusted','Local'] },
  ]).sort((a, b) => b.rating - a.rating);
};

export default function ServiceProvidersScreen({ route, navigation }) {
  const { category, icon, color } = route.params || {};
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('rating');

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${BACKEND}/providers/nearby?category=${category}&latitude=13.0827&longitude=80.2707&radius=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const list = data?.data || data || [];
      setProviders(list.length > 0 ? list : getMock(category));
    } catch {
      setProviders(getMock(category));
    } finally { setLoading(false); }
  };

  const sorted = [...providers]
    .filter(p => !search || (p.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'rating')   return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'reviews')  return (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === 'distance') return parseFloat(a.distance || 99) - parseFloat(b.distance || 99);
      return 0;
    });

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>

      {/* Header */}
      <View style={{ backgroundColor: '#FFFFFF', paddingTop: 52,
        paddingHorizontal: 20, paddingBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#F0F0F0',
              alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#333', fontSize: 22 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 32 }}>{icon}</Text>
          <View>
            <Text style={{ color: '#1A1A1A', fontSize: 20, fontWeight: '800' }}>{category}</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>
              {loading ? 'Searching nearby...' : `${sorted.length} found near you`}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
          borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E0E0E0' }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: '#333' }}
            placeholder={`Search ${category}...`}
            placeholderTextColor="#AAA"
            value={search} onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Sort Tabs */}
      <View style={{ flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
        <Text style={{ color: '#888', fontSize: 12, alignSelf: 'center', marginRight: 4 }}>
          Sort:
        </Text>
        {[
          { v: 'rating',   l: '⭐ Rating' },
          { v: 'reviews',  l: '💬 Reviews' },
          { v: 'distance', l: '📍 Nearest' },
        ].map(s => (
          <TouchableOpacity key={s.v} onPress={() => setSortBy(s.v)}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: sortBy === s.v ? (color || '#FF5722') : '#F5F5F5',
              borderWidth: 1, borderColor: sortBy === s.v ? (color || '#FF5722') : '#E0E0E0' }}>
            <Text style={{ color: sortBy === s.v ? '#fff' : '#666',
              fontWeight: '700', fontSize: 12 }}>{s.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={color || '#FF5722'} />
          <Text style={{ color: '#888', marginTop: 12, fontSize: 14 }}>
            Finding best {category} near you...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
          {sorted.map((item, idx) => (
            <View key={item.id || idx}
              style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
                marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06,
                shadowRadius: 8, elevation: 2 }}>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                {/* Rank Badge */}
                {idx < 3 && (
                  <View style={{ position: 'absolute', top: -8, left: -8, zIndex: 1,
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32',
                    alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                      {idx + 1}
                    </Text>
                  </View>
                )}

                {/* Icon */}
                <View style={{ width: 60, height: 60, borderRadius: 16,
                  backgroundColor: `${color || '#FF5722'}15`,
                  alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Text style={{ fontSize: 32 }}>{icon}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#1A1A1A', fontWeight: '800', fontSize: 15 }}
                      numberOfLines={1}>{item.name}</Text>
                    <View style={{ backgroundColor: item.open !== false ? '#E8F5E9' : '#FFEBEE',
                      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: item.open !== false ? '#4CAF50' : '#F44336',
                        fontSize: 10, fontWeight: '700' }}>
                        {item.open !== false ? '● Open' : '● Closed'}
                      </Text>
                    </View>
                  </View>

                  {/* Stars */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Text style={{ color: '#FFC107', fontSize: 13 }}>
                      {'★'.repeat(Math.round(item.rating || 4))}
                      {'☆'.repeat(5 - Math.round(item.rating || 4))}
                    </Text>
                    <Text style={{ color: '#FFC107', fontWeight: '800', fontSize: 13 }}>
                      {item.rating}
                    </Text>
                    <Text style={{ color: '#888', fontSize: 12 }}>
                      ({item.reviews?.toLocaleString()} reviews)
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <Text style={{ color: color || '#FF5722', fontWeight: '700', fontSize: 13 }}>
                      {item.price}
                    </Text>
                    <Text style={{ color: '#888', fontSize: 12 }}>📍 {item.distance}</Text>
                  </View>
                </View>
              </View>

              {/* Tags */}
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {(item.tags || [category]).map((tag, i) => (
                  <View key={i} style={{ backgroundColor: `${color || '#FF5722'}12`,
                    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: color || '#FF5722', fontSize: 11, fontWeight: '600' }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {item.phone ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}
                    style={{ flex: 1, backgroundColor: '#E8F5E9', borderRadius: 12,
                      padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 13 }}>📞 Call</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => navigation.navigate('BookingConfirm', {
                    provider: { ...item, user: { name: item.name } },
                    service: { id: category?.toLowerCase(), label: category, icon, color },
                  })}
                  style={{ flex: 2, backgroundColor: color || '#FF5722',
                    borderRadius: 12, padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                    Book Now →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </View>
  );
}
