import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@src/theme/colors';
import { RoleGuard } from '@src/shared/components/RoleGuard';

export default function PersonalLayout(): React.JSX.Element {
  return (
    <RoleGuard allowedRoles={['personal']}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: { backgroundColor: Colors.white },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Animales',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paw" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="solicitudes/index"
          options={{
            title: 'Solicitudes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="entrevistas/index"
          options={{
            title: 'Entrevistas',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reportes/index"
          options={{
            title: 'Reportes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="alert-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="animal/registrar" options={{ href: null }} />
        <Tabs.Screen name="animal/editar/[id]" options={{ href: null }} />
        <Tabs.Screen name="solicitudes/[id]" options={{ href: null }} />
        <Tabs.Screen name="entrevistas/agendar/[solicitudId]" options={{ href: null }} />
        <Tabs.Screen name="reportes/mapa" options={{ href: null }} />
        <Tabs.Screen name="reportes/[id]" options={{ href: null }} />
      </Tabs>
    </RoleGuard>
  );
}
