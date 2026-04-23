import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '@src/theme/colors';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingIndicator({
  size = 'large',
  fullScreen = false,
}: LoadingIndicatorProps): React.JSX.Element {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={Colors.primary} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={Colors.primary} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
