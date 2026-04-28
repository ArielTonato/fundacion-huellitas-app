import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@src/theme/colors';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface ProfileAvatarProps {
  uri?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export function ProfileAvatar({
  uri,
  size,
  style,
  fallbackIconSize,
  fallbackIconColor = Colors.primary,
  backgroundColor = Colors.white,
  borderColor = Colors.neutralMid,
  borderWidth = 1,
}: ProfileAvatarProps): React.JSX.Element {
  const iconSize = fallbackIconSize ?? Math.round(size * 0.5);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor,
          borderWidth,
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <Ionicons name="person" size={iconSize} color={fallbackIconColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});