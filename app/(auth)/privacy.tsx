import { Ionicons } from '@expo/vector-icons';
import { DATA_TREATMENT_PURPOSES } from '@src/shared/constants/privacy';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function PrivacyScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.82} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={36} color={Colors.secondary} />
          </View>
          <Text style={styles.title}>Política de privacidad</Text>
          <Text style={styles.subtitle}>
            Fundación Huellitas usa tus datos únicamente para permitir el funcionamiento de la aplicación.
          </Text>
        </View>

        <Section title="Datos que se registran">
          <Text style={styles.paragraph}>
            La aplicación puede registrar tu nombre, correo electrónico, teléfono, foto de perfil, solicitudes de adopción,
            fotos adjuntas a solicitudes, reportes de mascotas extraviadas, ubicación seleccionada para reportes y token de notificaciones.
          </Text>
        </Section>

        <Section title="Finalidad del tratamiento">
          <Text style={styles.paragraph}>
            Los datos no se venden ni se usan para fines externos. Se tratan solo para:
          </Text>
          <View style={styles.list}>
            {DATA_TREATMENT_PURPOSES.map((purpose) => (
              <View key={purpose} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={17} color={Colors.secondary} />
                <Text style={styles.listText}>{purpose}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Acceso y seguridad">
          <Text style={styles.paragraph}>
            El acceso se controla mediante autenticación y roles. Los adoptantes acceden a sus propios datos y el personal
            autorizado accede únicamente a la información necesaria para gestionar adopciones, entrevistas y reportes.
          </Text>
        </Section>

        <Section title="Consentimiento informado">
          <Text style={styles.paragraph}>
            Al registrarte, debes aceptar de forma expresa esta política y autorizar el tratamiento de tus datos para el uso de la aplicación.
          </Text>
        </Section>

        <Section title="Supresión de datos">
          <Text style={styles.paragraph}>
            Los usuarios con rol de adoptante pueden eliminar su cuenta desde la pantalla de perfil. Esta acción elimina la cuenta y los datos asociados gestionados por la aplicación.
          </Text>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  backText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    height: 68,
    justifyContent: 'center',
    marginBottom: Spacing.md,
    width: 68,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  paragraph: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  list: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  listItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  listText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
