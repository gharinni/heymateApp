import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Linking, Animated } from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';

export default function RateAppScreen({ navigation }) {
  const { colors } = useAppTheme();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const s = makeStyles(colors);

  const labels = ['', 'Terrible 😞', 'Poor 😕', 'Okay 🙂', 'Good 😊', 'Excellent 🤩'];
  const highlights = ['', '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];

  const submit = () => {
    if (rating === 0) { Alert.alert('Please select a rating'); return; }
    if (rating >= 4) {
      Alert.alert(
        '🎉 Thank you!',
        'We\'re glad you love HeyMate! Would you like to rate us on the Play Store?',
        [
          { text: 'Maybe Later' },
          { text: '⭐ Rate on Play Store', onPress: () => Linking.openURL('market://details?id=com.heymate') },
        ]
      );
    } else {
      Alert.alert('💬 Thank you for your feedback!', 'We\'ll use your feedback to improve HeyMate.');
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[s.container, s.center]}>
        <Text style={{ fontSize: 80 }}>🎉</Text>
        <Text style={s.thankTitle}>Thank You!</Text>
        <Text style={s.thankSub}>Your feedback helps us improve HeyMate for everyone.</Text>
        <TouchableOpacity style={s.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={s.doneBtnText}>Back to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>⭐ Rate HeyMate</Text>
      </View>

      <View style={s.card}>
        <Text style={{ fontSize: 64, textAlign: 'center' }}>⚡</Text>
        <Text style={s.cardTitle}>Enjoying HeyMate?</Text>
        <Text style={s.cardSub}>Your rating helps us grow and serve you better</Text>

        {/* Stars */}
        <View style={s.starsRow}>
          {[1,2,3,4,5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={s.starBtn}>
              <Text style={[s.star, (rating >= star) && { color: highlights[rating] }]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <Text style={[s.ratingLabel, { color: highlights[rating] }]}>{labels[rating]}</Text>
        )}

        {/* Review text (show for 1-3 stars) */}
        {rating > 0 && rating <= 3 && (
          <TextInput
            style={s.reviewInput}
            value={review}
            onChangeText={setReview}
            placeholder="Tell us what we can improve..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
        )}

        {rating >= 4 && (
          <View style={s.loveBox}>
            <Text style={s.loveText}>🥰 We love hearing that! Consider leaving a review on the Play Store too — it really helps!</Text>
          </View>
        )}

        <TouchableOpacity style={[s.submitBtn, rating === 0 && s.submitBtnDisabled]} onPress={submit}>
          <Text style={s.submitBtnText}>{rating >= 4 ? '⭐ Submit & Rate on Play Store' : '📤 Submit Feedback'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 56 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  title: { color: c.text, fontSize: 18, fontWeight: '800' },
  card: { backgroundColor: c.card, borderRadius: 24, margin: 20, padding: 28, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
  cardTitle: { color: c.text, fontSize: 22, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  cardSub: { color: c.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn: { padding: 6 },
  star: { fontSize: 48, color: c.border },
  ratingLabel: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  reviewInput: { width: '100%', backgroundColor: c.bg, color: c.text, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.border, fontSize: 14, textAlignVertical: 'top', marginBottom: 16, minHeight: 100 },
  loveBox: { backgroundColor: `${c.primary}15`, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: `${c.primary}33` },
  loveText: { color: c.text, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  submitBtn: { width: '100%', backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  thankTitle: { color: c.text, fontSize: 26, fontWeight: '800', marginTop: 16 },
  thankSub: { color: c.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 22 },
  doneBtn: { backgroundColor: c.primary, borderRadius: 14, paddingHorizontal: 36, paddingVertical: 14 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});