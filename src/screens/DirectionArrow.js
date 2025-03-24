import { View } from 'react-native';
import styles from './styles';

const DirectionArrow = ({ heading }) => (
  <View style={[styles.arrowContainer, { transform: [{ rotate: `${heading}deg` }] }]}>
    <View style={styles.arrow} />
  </View>
);

export default DirectionArrow;
