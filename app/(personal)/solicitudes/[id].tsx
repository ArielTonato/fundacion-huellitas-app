import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@src/theme/colors';

export default function DetalleSolicitudScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Detalle de Solicitud</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  text: { fontSize: 18, color: Colors.textPrimary },
});
