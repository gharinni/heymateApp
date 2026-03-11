import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useDispatch } from 'react-redux';
import { setUserLocation, setLocationError } from '../store/slices/locationSlice';

/**
 * useLocation — requests permission and returns current user location.
 * Also exports a startTracking function for live provider location streaming.
 */
export function useLocation() {
  const dispatch = useDispatch();
  const [location, setLocation] = useState(null);
  const [permission, setPermission] = useState(false);
  const watchRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        dispatch(setLocationError('Location permission denied'));
        return;
      }
      setPermission(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(coords);
      dispatch(setUserLocation(coords));
    })();

    return () => { if (watchRef.current) watchRef.current.remove(); };
  }, []);

  /**
   * Start streaming location updates via WebSocket (for providers en route).
   * @param {Function} onUpdate - called with {lat, lng} every update
   */
  const startTracking = async (onUpdate) => {
    await Location.requestBackgroundPermissionsAsync();
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
      (loc) => {
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setLocation(coords);
        dispatch(setUserLocation(coords));
        onUpdate(coords);
      }
    );
  };

  const stopTracking = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  };

  return { location, permission, startTracking, stopTracking };
}
