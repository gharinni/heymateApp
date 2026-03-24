import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

export default function TrackingScreen({ navigation }) {
  const [status, setStatus] = useState('Searching for provider...');
  const [step, setStep] = useState(0);

  useEffect(() => {
    const steps = [
      'Searching for provider...',
      'Provider accepted',
      'On the way 🚗',
      'Reached location 📍',
      'Service in progress 🔧',
      'Completed ✅'
    ];

    let i = 0;

    const interval = setInterval(() => {
      i++;
      if (i < steps.length) {
        setStatus(steps[i]);
        setStep(i);
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracking Service</Text>

      <ActivityIndicator size="large" color="#FF5722" />

      <Text style={styles.status}>{status}</Text>
      <Text>Step {step + 1} of 6</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.btnText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  status: { marginTop: 20, fontSize: 16 },
  button: { marginTop: 30, backgroundColor: '#FF5722', padding: 10, borderRadius: 8 },
  btnText: { color: '#fff' }
});