import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Linking,
} from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';
import { useLocation } from '../hooks/useLocation';
import { providerAPI } from '../api/provider.api';
import { SERVICES } from '../constants';

// ─── Rich mock data ────────────────────────────────────────────────────────────
const MOCK_SHOPS = {
  food:        [
    { id:'s1', type:'shop', name:'Saravana Bhavan', rating:4.7, reviews:1240, price:'₹80–₹250', distance:'0.3 km', open:true,  timing:'6AM–11PM', tags:['Veg','South Indian','Tiffin'], phone:'9876500001' },
    { id:'s2', type:'shop', name:'KFC',             rating:4.2, reviews:890,  price:'₹200–₹600',distance:'0.8 km', open:true,  timing:'10AM–12AM',tags:['Non-Veg','Fast Food','Delivery'], phone:'9876500002' },
    { id:'s3', type:'shop', name:'Murugan Idli',    rating:4.9, reviews:2100, price:'₹40–₹150', distance:'1.1 km', open:false, timing:'5AM–11AM', tags:['Veg','Breakfast','Famous'], phone:'9876500003' },
  ],
  grocery:     [
    { id:'s4', type:'shop', name:'Nilgiris Fresh',  rating:4.5, reviews:432,  price:'MRP',       distance:'0.5 km', open:true, timing:'8AM–10PM', tags:['Supermarket','Organic','Delivery'], phone:'9876500004' },
    { id:'s5', type:'shop', name:'DMart',           rating:4.3, reviews:780,  price:'Wholesale', distance:'1.4 km', open:true, timing:'9AM–10PM', tags:['Budget','Bulk','All items'], phone:'9876500005' },
  ],
  hospital:    [
    { id:'s6', type:'shop', name:'Apollo Clinic',   rating:4.8, reviews:560,  price:'₹300 consult',distance:'0.7 km',open:true, timing:'8AM–8PM', tags:['Multi-specialty','24hr','Emergency'], phone:'9876500006' },
  ],
  pharmacy:    [
    { id:'s7', type:'shop', name:'MedPlus',         rating:4.4, reviews:210,  price:'MRP -10%',  distance:'0.2 km', open:true, timing:'8AM–10PM', tags:['All brands','Generic','Delivery'], phone:'9876500007' },
  ],
  salon:       [
    { id:'s8', type:'shop', name:'Naturals Salon',  rating:4.6, reviews:340,  price:'₹200–₹2000',distance:'0.6 km', open:true, timing:'9AM–9PM', tags:['Unisex','AC','Premium'], phone:'9876500008' },
  ],
  stationary:  [
    { id:'s9', type:'shop', name:'Landmark Books',  rating:4.3, reviews:190,  price:'MRP',       distance:'1.2 km', open:true, timing:'10AM–9PM', tags:['Books','Stationery','Toys'], phone:'9876500009' },
  ],
  fitness:     [
    { id:'s10',type:'shop', name:'Gold\'s Gym',     rating:4.7, reviews:430,  price:'₹999/mo',   distance:'0.9 km', open:true, timing:'5AM–11PM', tags:['AC','Trainers','Cardio'], phone:'9876500010' },
  ],
  shopping:    [
    { id:'s11',type:'shop', name:'Saravana Stores', rating:4.4, reviews:1100, price:'Bargain',   distance:'2.1 km', open:true, timing:'9AM–10PM', tags:['Clothes','Electronics','Bargain'], phone:'9876500011' },
  ],
  petcare:     [
    { id:'s12',type:'shop', name:'PetZone Clinic',  rating:4.8, reviews:280,  price:'₹500 consult',distance:'1.5 km',open:true,timing:'9AM–7PM', tags:['Vet','Grooming','Boarding'], phone:'9876500012' },
  ],
};

const MOCK_PEOPLE = {
  plumber:     [
    { id:'p1', type:'person', name:'Ravi Kumar',     rating:4.8, orders:134, price:'₹300/visit', distance:'0.8 km', availability:'full_time',  exp:'5 yrs', skills:['Pipe repair','Leaks','Bathroom fitting'], phone:'9876500101' },
    { id:'p2', type:'person', name:'Murugan V',      rating:4.6, orders:89,  price:'₹280/visit', distance:'1.4 km', availability:'part_time',  exp:'3 yrs', skills:['Kitchen sink','Water heater'], phone:'9876500102' },
  ],
  electrician: [
    { id:'p3', type:'person', name:'Suresh M',       rating:4.7, orders:210, price:'₹400/visit', distance:'0.6 km', availability:'full_time',  exp:'7 yrs', skills:['Wiring','Short circuit','AC installation'], phone:'9876500103' },
    { id:'p4', type:'person', name:'Karthik R',      rating:4.5, orders:56,  price:'₹350/visit', distance:'2.0 km', availability:'student',    exp:'1 yr',  skills:['Basic wiring','Bulb/Fan fixing'], phone:'9876500104' },
  ],
  carpenter:   [
    { id:'p5', type:'person', name:'Anbu Selvan',    rating:4.9, orders:178, price:'₹500/day',   distance:'1.2 km', availability:'full_time',  exp:'10 yrs',skills:['Furniture repair','Door fixing','Polishing'], phone:'9876500105' },
  ],
  tutor:       [
    { id:'p6', type:'person', name:'Priya S',        rating:5.0, orders:42,  price:'₹200/hr',    distance:'0.5 km', availability:'student',    exp:'2 yrs', skills:['Maths','Physics','Class 10-12'], phone:'9876500106', badge:'Student Tutor 🎓' },
    { id:'p7', type:'person', name:'Ramesh T',       rating:4.8, orders:96,  price:'₹400/hr',    distance:'1.8 km', availability:'evenings',   exp:'5 yrs', skills:['All subjects','Spoken English','IELTS'], phone:'9876500107' },
    { id:'p8', type:'person', name:'Kavya M',        rating:4.9, orders:31,  price:'₹150/hr',    distance:'0.3 km', availability:'student',    exp:'1 yr',  skills:['Tamil','Hindi','Drawing'], phone:'9876500108', badge:'Student Tutor 🎓' },
  ],
  transport:   [
    { id:'p9', type:'person', name:'Selva Auto',     rating:4.6, orders:320, price:'₹12/km',     distance:'0.2 km', availability:'full_time',  exp:'8 yrs', skills:['Auto','City rides','Airport drop'], phone:'9876500109' },
    { id:'p10',type:'person', name:'Vijay Cab',      rating:4.5, orders:290, price:'₹15/km',     distance:'0.7 km', availability:'on_demand',  exp:'4 yrs', skills:['AC cab','Outstation','Night rides'], phone:'9876500110' },
  ],
  household:   [
    { id:'p11',type:'person', name:'Devi R',         rating:4.7, orders:65,  price:'₹800/day',   distance:'1.0 km', availability:'part_time',  exp:'4 yrs', skills:['Cooking','Cleaning','Child care'], phone:'9876500111' },
  ],
  mechanic:    [
    { id:'p12',type:'person', name:'Kumar Garage',   rating:4.8, orders:145, price:'₹200/hr',    distance:'1.3 km', availability:'full_time',  exp:'12 yrs',skills:['2-wheeler','4-wheeler','AC repair'], phone:'9876500112' },
  ],
  events:      [
    { id:'p13',type:'person', name:'Creative Events',rating:4.9, orders:55,  price:'₹5000/event',distance:'2.0 km', availability:'weekends',  exp:'6 yrs', skills:['Decoration','Photography','Catering'], phone:'9876500113' },
  ],
  salon:       [
    { id:'p14',type:'person', name:'Meena Beauty',   rating:4.8, orders:220, price:'₹300/session',distance:'0.9 km',availability:'full_time',  exp:'5 yrs', skills:['Bridal makeup','Mehendi','Home visit'], phone:'9876500114' },
  ],
  laundry:     [
    { id:'p15',type:'person', name:'Wash & Fold',    rating:4.5, orders:88,  price:'₹100/kg',    distance:'0.6 km', availability:'full_time',  exp:'3 yrs', skills:['Pickup','Delivery','Dry clean'], phone:'9876500115' },
  ],
  fitness:     [
    { id:'p16',type:'person', name:'Trainer Arun',   rating:4.9, orders:75,  price:'₹500/session',distance:'0.4 km',availability:'student',   exp:'2 yrs', skills:['Home workout','Weight loss','Yoga'], phone:'9876500116', badge:'Student Trainer 🎓' },
  ],
  blood:       [
    { id:'p17',type:'person', name:'Donor - A+',     rating:5.0, orders:12,  price:'Free',        distance:'1.1 km', availability:'on_demand',  exp:'—',     skills:['Blood Group A+','Voluntary donor'], phone:'9876500117' },
    { id:'p18',type:'person', name:'Donor - O+',     rating:5.0, orders:8,   price:'Free',        distance:'0.9 km', availability:'on_demand',  exp:'—',     skills:['Blood Group O+','Universal donor'], phone:'9876500118' },
  ],
  petcare:     [
    { id:'p19',type:'person', name:'Pet Sitter Nisha',rating:4.9,orders:34,  price:'₹300/day',   distance:'0.8 km', availability:'student',    exp:'1 yr',  skills:['Dog walking','Pet sitting','Feeding'], phone:'9876500119', badge:'Student Provider 🎓' },
  ],
};

const AVAIL_COLORS = { full_time:'#00C853', part_time:'#FFC107', student:'#2196F3', evenings:'#9C27B0', weekends:'#FF9800', on_demand:'#FF5722' };
const AVAIL_LABELS = { full_time:'Full Time', part_time:'Part Time', student:'Student Provider', evenings:'Evenings Only', weekends:'Weekends', on_demand:'On Demand' };

export default function ServiceProvidersScreen({ route, navigation }) {
  const { service } = route.params;
  const { colors } = useAppTheme();
  const { location } = useLocation();
  const c = colors;

  const [tab, setTab] = useState(service.type === 'shop' ? 'shops' : service.type === 'person' ? 'people' : 'shops');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setShops(MOCK_SHOPS[service.id] || []);
      setPeople(MOCK_PEOPLE[service.id] || []);
      setLoading(false);
    }, 800);
  }, [service.id]);

  const filterAndSort = (list) => list
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : sortBy === 'distance' ? parseFloat(a.distance) - parseFloat(b.distance) : 0);

  const showTabs = service.type === 'both';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: c.bg }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{service.icon} {service.label}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1 }}>{service.description}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: c.card, borderRadius: 14, marginHorizontal: 20, borderWidth: 1, borderColor: c.border, marginBottom: 12 }}>
        <Text>🔍</Text>
        <TextInput placeholder="Search by name..." placeholderTextColor={c.textMuted}
          style={{ flex: 1, color: c.text, paddingVertical: 11, fontSize: 14 }} value={search} onChangeText={setSearch} />
      </View>

      {/* Tabs (only for 'both' type) */}
      {showTabs && (
        <View style={{ flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 12 }}>
          {[{ key:'shops', label:'🏪 Shops', count: shops.length }, { key:'people', label:'👤 Providers', count: people.length }].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: tab === t.key ? c.primary : c.card, borderWidth: 1, borderColor: tab === t.key ? c.primary : c.border }}>
              <Text style={{ color: tab === t.key ? '#fff' : c.textMuted, fontWeight: '700', fontSize: 13 }}>{t.label} ({t.count})</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sort Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {[{ key:'rating', label:'⭐ Top Rated' }, { key:'distance', label:'📍 Nearest' }].map(s => (
          <TouchableOpacity key={s.key} onPress={() => setSortBy(s.key)}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: sortBy === s.key ? `${c.primary}22` : c.card, borderWidth: 1, borderColor: sortBy === s.key ? c.primary : c.border }}>
            <Text style={{ color: sortBy === s.key ? c.primary : c.textMuted, fontSize: 12, fontWeight: '600' }}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={{ color: c.textMuted }}>Finding {service.label} nearby...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
          {(service.type === 'shop' || (showTabs && tab === 'shops')) && (
            <>
              {filterAndSort(shops).length === 0
                ? <EmptyState type="shops" colors={c} />
                : filterAndSort(shops).map(s => (
                    <ShopCard key={s.id} shop={s} service={service} colors={c}
                      onBook={() => navigation.navigate('BookingConfirm', { provider: { ...s, user: { name: s.name }, serviceType: service.id }, service })} />
                  ))
              }
            </>
          )}

          {(service.type === 'person' || (showTabs && tab === 'people')) && (
            <>
              {filterAndSort(people).length === 0
                ? <EmptyState type="people" colors={c} />
                : filterAndSort(people).map(p => (
                    <PersonCard key={p.id} person={p} service={service} colors={c}
                      onBook={() => navigation.navigate('BookingConfirm', { provider: { ...p, user: { name: p.name }, serviceType: service.id }, service })} />
                  ))
              }
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ShopCard({ shop, service, colors: c, onBook }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setOpen(!open)} activeOpacity={0.85} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {/* Icon */}
          <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: `${service.color}22`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${service.color}44` }}>
            <Text style={{ fontSize: 30 }}>{service.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{shop.name}</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: shop.open ? `${c.success}20` : '#EF444420' }}>
                <Text style={{ color: shop.open ? c.success : '#EF4444', fontSize: 11, fontWeight: '700' }}>{shop.open ? '● Open' : '● Closed'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '700' }}>⭐ {shop.rating}</Text>
              <Text style={{ color: c.border }}>·</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{shop.reviews} reviews</Text>
              <Text style={{ color: c.border }}>·</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>📍 {shop.distance}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>{shop.price}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>⏰ {shop.timing}</Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {shop.tags.map(tag => (
            <View key={tag} style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.textMuted, fontSize: 11 }}>{tag}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {/* Expanded actions */}
      {open && (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border }}>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${shop.phone}`)}
            style={{ flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: c.border }}>
            <Text style={{ fontSize: 18 }}>📞</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginTop: 4 }}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: c.border }}>
            <Text style={{ fontSize: 18 }}>🗺️</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginTop: 4 }}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBook}
            style={{ flex: 1, padding: 14, alignItems: 'center', backgroundColor: `${c.primary}15` }}>
            <Text style={{ fontSize: 18 }}>📅</Text>
            <Text style={{ color: c.primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Book</Text>
          </TouchableOpacity>
        </View>
      )}

      {!open && (
        <TouchableOpacity onPress={onBook} style={{ backgroundColor: c.primary, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Book / Order →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PersonCard({ person, service, colors: c, onBook }) {
  const [open, setOpen] = useState(false);
  const availColor = AVAIL_COLORS[person.availability] || c.primary;
  const availLabel = AVAIL_LABELS[person.availability] || person.availability;

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setOpen(!open)} activeOpacity={0.85} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: `${service.color}22`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${service.color}44` }}>
            <Text style={{ fontSize: 28 }}>{service.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{person.name}</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: `${availColor}20` }}>
                <Text style={{ color: availColor, fontSize: 10, fontWeight: '700' }}>{availLabel}</Text>
              </View>
            </View>

            {/* Student badge */}
            {person.badge && (
              <View style={{ backgroundColor: '#2196F322', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 3 }}>
                <Text style={{ color: '#2196F3', fontSize: 11, fontWeight: '700' }}>{person.badge}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: person.badge ? 5 : 5 }}>
              <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '700' }}>⭐ {person.rating}</Text>
              <Text style={{ color: c.border }}>·</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{person.orders} jobs</Text>
              <Text style={{ color: c.border }}>·</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>📍 {person.distance}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ color: c.primary, fontWeight: '800', fontSize: 14 }}>{person.price}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>Exp: {person.exp}</Text>
            </View>
          </View>
        </View>

        {/* Skills */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {person.skills.map(sk => (
            <View key={sk} style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: `${service.color}15`, borderWidth: 1, borderColor: `${service.color}33` }}>
              <Text style={{ color: service.color, fontSize: 11, fontWeight: '600' }}>{sk}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {open && (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border }}>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${person.phone}`)}
            style={{ flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: c.border }}>
            <Text style={{ fontSize: 18 }}>📞</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginTop: 4 }}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: c.border }}>
            <Text style={{ fontSize: 18 }}>💬</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginTop: 4 }}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBook}
            style={{ flex: 2, padding: 14, alignItems: 'center', backgroundColor: `${c.primary}15` }}>
            <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>📅 Book Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {!open && (
        <TouchableOpacity onPress={onBook} style={{ backgroundColor: c.primary, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Book Now →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyState({ type, colors: c }) {
  return (
    <View style={{ alignItems: 'center', padding: 40 }}>
      <Text style={{ fontSize: 48 }}>{type === 'shops' ? '🏪' : '👤'}</Text>
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 16, marginTop: 12 }}>No {type} found nearby</Text>
      <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 }}>Check back soon as more providers join!</Text>
    </View>
  );
}
