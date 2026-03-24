// RegisterScreen — redirects to LoginScreen signup tab
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function RegisterScreen({ navigation }) {
  useEffect(() => {
    navigation.replace('Login');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D1A',
      alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
    </View>
  );
}
