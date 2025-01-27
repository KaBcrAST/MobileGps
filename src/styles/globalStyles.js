import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 20,
    color: '#000',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default styles;