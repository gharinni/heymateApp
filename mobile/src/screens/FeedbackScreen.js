import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import api from '../api/index';
import { COLORS } from '../constants';

export default function FeedbackScreen({ route, navigation }) {
  const { booking } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) { Alert.alert('Please select a rating'); return; }
    try {
      setLoading(true);
      if (booking?.id) {
        await api.post('/api/reviews', {
          bookingId: booking.id,
          rating,
          comment,
        });
      }
      Alert.alert('Thank you! 🎉', 'Your feedback helps improve the service.', [
        { text: 'Done', onPress: () => navigation.navigate('Main') },
      ]);
    } catch (e) {
      // Even if API fails, go home
      navigation.navigate('Main');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>⭐</Text>
        <Text style={styles.title}>Rate Your Experience</Text>
        <Text style={styles.subtitle}>
          How was {booking?.provider?.user?.name || 'the provider'}?
        </Text>

        {/* Stars */}
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starBtn}>
              <Text style={[styles.star, s <= rating ? styles.starActive : styles.starInactive]}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingLabel}>
          {rating === 0 ? 'Tap to rate' : ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🤩'][rating]}
        </Text>

        <TextInput
          placeholder="Leave a comment (optional)..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Submit Feedback 🎉</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', backgroundColor: COLORS.card,
    borderRadius: 24, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 24, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn: { padding: 4 },
  star: { fontSize: 40 },
  starActive: { color: '#FFD600' },
  starInactive: { color: COLORS.border },
  ratingLabel: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600', marginBottom: 20 },
  input: {
    width: '100%', backgroundColor: COLORS.bg,
    color: COLORS.text, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
    fontSize: 14, marginBottom: 20,
    textAlignVertical: 'top', minHeight: 90,
  },
  submitBtn: {
    width: '100%', backgroundColor: COLORS.primary,
    borderRadius: 14, padding: 16, alignItems: 'center',
    marginBottom: 12,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skipBtn: { padding: 8 },
  skipText: { color: COLORS.textMuted, fontSize: 14 },
});
