import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, TextInput, Alert } from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';

const FAQ = [
  { q: 'How do I book a service?', a: 'Go to Home → tap any service category → select a nearby provider → fill in your address and notes → tap Book Now.' },
  { q: 'How do I become a provider?', a: 'Go to Profile → toggle the switch from User to Provider Mode. Fill in your service type and price, then turn Online in the Provider Dashboard.' },
  { q: 'Is my location shared with providers?', a: 'Only when you make a booking. Your live location is shared during active bookings for tracking. You can stop sharing anytime.' },
  { q: 'How does She-Safe work?', a: 'Go to Emergency → enable She-Safe Mode. It will share your live location with trusted contacts and send SOS alerts if triggered.' },
  { q: 'How do I add trusted contacts?', a: 'Go to Emergency → tap Manage Contacts → add phone numbers of people you trust.' },
  { q: 'How do I pay for a service?', a: 'After the provider completes the job, you will be taken to the Payment screen where you can pay via UPI, card, or cash.' },
  { q: 'Can I cancel a booking?', a: 'Yes, go to My Bookings → tap the booking → tap Cancel. Cancellation is free before the provider accepts.' },
  { q: 'How do I contact a provider?', a: 'During an active booking, go to the Tracking screen → tap the Call button to call the provider directly.' },
];

export default function HelpSupportScreen({ navigation }) {
  const { colors } = useAppTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [message, setMessage] = useState('');
  const s = makeStyles(colors);

  const sendMessage = () => {
    if (!message.trim()) return;
    Alert.alert('✅ Message Sent', 'Our support team will respond within 24 hours via WhatsApp or email.');
    setMessage('');
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>❓ Help & Support</Text>
      </View>

      {/* Quick contact */}
      <View style={s.section}>
        <Text style={s.groupTitle}>📞 Contact Us</Text>
        <View style={s.contactGrid}>
          {[
            { icon: '💬', label: 'WhatsApp', sub: 'Fastest response', color: '#25D366', onPress: () => Linking.openURL('https://wa.me/919999999999') },
            { icon: '📧', label: 'Email', sub: 'support@heymate.in', color: '#EA4335', onPress: () => Linking.openURL('mailto:support@heymate.in') },
            { icon: '📞', label: 'Call Us', sub: '1800-123-4567', color: colors.primary, onPress: () => Linking.openURL('tel:18001234567') },
            { icon: '🌐', label: 'Website', sub: 'heymate.in', color: '#4285F4', onPress: () => Linking.openURL('https://heymate.in') },
          ].map(c => (
            <TouchableOpacity key={c.label} style={[s.contactCard, { borderColor: `${c.color}44` }]} onPress={c.onPress}>
              <Text style={{ fontSize: 28 }}>{c.icon}</Text>
              <Text style={[s.contactLabel, { color: c.color }]}>{c.label}</Text>
              <Text style={s.contactSub}>{c.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Send message */}
      <View style={s.section}>
        <Text style={s.groupTitle}>✉️ Send Us a Message</Text>
        <TextInput
          style={s.textarea}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue or question..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
          <Text style={s.sendBtnText}>Send Message 📤</Text>
        </TouchableOpacity>
      </View>

      {/* FAQs */}
      <View style={s.section}>
        <Text style={s.groupTitle}>🙋 Frequently Asked Questions</Text>
        {FAQ.map((faq, i) => (
          <TouchableOpacity key={i} onPress={() => setOpenFaq(openFaq === i ? null : i)}>
            <View style={[s.faqQ, openFaq === i && { borderBottomWidth: 0 }]}>
              <Text style={s.faqQText}>{faq.q}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>{openFaq === i ? '▲' : '▼'}</Text>
            </View>
            {openFaq === i && (
              <View style={s.faqA}>
                <Text style={s.faqAText}>{faq.a}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 56 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  title: { color: c.text, fontSize: 18, fontWeight: '800' },
  section: { backgroundColor: c.card, borderRadius: 16, marginHorizontal: 20, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: c.border },
  groupTitle: { color: c.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  contactCard: { width: '47%', backgroundColor: c.bg, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, gap: 4 },
  contactLabel: { fontWeight: '700', fontSize: 14 },
  contactSub: { color: c.textMuted, fontSize: 11, textAlign: 'center' },
  textarea: { backgroundColor: c.bg, color: c.text, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  sendBtn: { backgroundColor: c.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  faqQ: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border },
  faqQText: { flex: 1, color: c.text, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  faqA: { backgroundColor: c.bg, borderRadius: 10, padding: 12, marginBottom: 4 },
  faqAText: { color: c.textMuted, fontSize: 13, lineHeight: 20 },
});