import { Colors } from '@src/theme/colors';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  fullScreen?: boolean;
  color?: string;
}

export function LoadingIndicator({
  size = 'large',
  fullScreen = false,
  color = Colors.primary,
}: LoadingIndicatorProps): React.JSX.Element {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={color} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
