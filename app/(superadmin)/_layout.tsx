import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatar } from '@src/shared/components/ProfileAvatar';
import { RoleGuard } from '@src/shared/components/RoleGuard';
import { useAuth } from '@src/shared/hooks/useAuth';
import { Colors } from '@src/theme/colors';
import { Tabs } from 'expo-router';
import { Image, Text, View } from 'react-native';

export default function SuperAdminLayout(): React.JSX.Element {
  const { userProfile } = useAuth();

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 35,
                height: 35,
                backgroundColor: Colors.white,
                borderRadius: 100,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image
                  source={require('../../assets/huellitas/logo.png')}
                  style={{ width: 65, height: 65 }}
                  resizeMode="contain"
                />
              </View>
              {/* Nuevo Texto agregado a lado de la imagen */}
              <Text style={{ 
                color: Colors.white, 
                marginLeft: 10, 
                fontSize: 18, 
                fontWeight: 'semibold' 
              }}>
                Fundación Huellitas
              </Text>
            </View>
          ),
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: { backgroundColor: Colors.white },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <ProfileAvatar
                uri={userProfile?.fotoPerfilUrl}
                size={size}
                fallbackIconSize={Math.round(size * 0.55)}
                fallbackIconColor={color}
                backgroundColor="transparent"
                borderWidth={0}
              />
            ),
          }}
        />
      </Tabs>
    </RoleGuard>
  );
}
