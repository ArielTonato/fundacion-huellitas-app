import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormField } from '@src/shared/components/FormField';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import { ProfileAvatar } from '@src/shared/components/ProfileAvatar';
import { StatusBadge } from '@src/shared/components/StatusBadge';
import type { User } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePersonalUsers } from '../hooks/usePersonalUsers';
import {
  personalEditSchema,
  personalSchema,
  type PersonalEditFormData,
  type PersonalFormData,
} from '../schemas/personalSchema';
import {
  crearPersonal,
  desactivarPersonal,
  editarPersonal,
  enviarNotificacionPrueba,
  reactivarPersonal,
} from '../services/personalService';

const DEFAULT_FORM_VALUES: PersonalFormData = {
  nombre: '',
  email: '',
  password: '',
  confirmPassword: '',
  telefono: '',
};

const DEFAULT_EDIT_FORM_VALUES: PersonalEditFormData = {
  uid: '',
  nombre: '',
  email: '',
  telefono: '',
};

function isActive(user: User): boolean {
  return user.activo !== false;
}

function matchesSearch(user: User, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [user.nombre, user.email, user.telefono ?? '']
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function ProfilePhotoPicker({
  uri,
  onPress,
}: {
  uri?: string | null;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.photoSection}>
      <ProfileAvatar uri={uri} size={96} fallbackIconSize={46} />
      <TouchableOpacity style={styles.photoButton} activeOpacity={0.82} onPress={onPress}>
        <Ionicons name="camera-outline" size={16} color={Colors.accent} />
        <Text style={styles.photoButtonText}>{uri ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface PersonalCardProps {
  actionLoading: boolean;
  user: User;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

function PersonalCard({ actionLoading, user, onEdit, onToggleStatus }: PersonalCardProps): React.JSX.Element {
  const active = isActive(user);

  return (
    <View style={styles.userCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={Colors.primary} />
        </View>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.userName}>{user.nombre}</Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={active ? 'checkmark-circle' : 'ban'}
              size={15}
              color={active ? Colors.secondary : Colors.error}
            />
            <StatusBadge label={active ? 'Activo' : 'Inactivo'} variant={active ? 'success' : 'error'} />
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={17} color={Colors.textSecondary} />
        <Text style={styles.infoText}>{user.email}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={17} color={Colors.textSecondary} />
        <Text style={styles.infoText}>{user.telefono || 'Telefono no registrado'}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          activeOpacity={0.82}
          disabled={actionLoading}
          onPress={() => onEdit(user)}
        >
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
          <Text style={[styles.statusButtonText, styles.editButtonText]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, active ? styles.disableButton : styles.enableButton]}
          activeOpacity={0.82}
          disabled={actionLoading}
          onPress={() => onToggleStatus(user)}
        >
          {actionLoading ? (
            <LoadingIndicator size="small" color={active ? Colors.error : Colors.secondary} />
          ) : (
            <>
              <Ionicons
                name={active ? 'lock-closed-outline' : 'refresh-outline'}
                size={18}
                color={active ? Colors.error : Colors.secondary}
              />
              <Text style={[styles.statusButtonText, active ? styles.disableButtonText : styles.enableButtonText]}>
                {active ? 'Desactivar' : 'Reactivar'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function GestionUsuariosScreen(): React.JSX.Element {
  const { users, loading, error, refresh } = usePersonalUsers();
  const [search, setSearch] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [testNotificationLoading, setTestNotificationLoading] = useState<boolean>(false);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonalFormData>({
    resolver: yupResolver(personalSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<PersonalEditFormData>({
    resolver: yupResolver(personalEditSchema),
    defaultValues: DEFAULT_EDIT_FORM_VALUES,
  });

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesSearch(user, search)),
    [users, search]
  );

  const closeModal = (): void => {
    setModalVisible(false);
    setEditingUser(null);
    setProfilePhotoUri(null);
    reset(DEFAULT_FORM_VALUES);
    resetEdit(DEFAULT_EDIT_FORM_VALUES);
  };

  const openCreateModal = (): void => {
    setEditingUser(null);
    setProfilePhotoUri(null);
    reset(DEFAULT_FORM_VALUES);
    setModalVisible(true);
  };

  const openEditModal = (user: User): void => {
    setEditingUser(user);
    setProfilePhotoUri(null);
    resetEdit({
      uid: user.uid,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono ?? '',
    });
    setModalVisible(true);
  };

  const pickProfilePhoto = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a la galeria para subir una foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  };

  const submitPersonal = async (data: PersonalFormData): Promise<void> => {
    try {
      setSubmitting(true);
      await crearPersonal(data, profilePhotoUri ?? undefined);
      closeModal();
      Alert.alert('Personal creado', 'La cuenta del personal fue creada correctamente.');
    } catch (submitError) {
      Alert.alert('Error', getErrorMessage(submitError, 'No se pudo crear la cuenta del personal.'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitEditPersonal = async (data: PersonalEditFormData): Promise<void> => {
    try {
      setSubmitting(true);
      await editarPersonal(data, profilePhotoUri ?? undefined);
      closeModal();
      Alert.alert('Personal actualizado', 'Los datos del personal fueron actualizados correctamente.');
    } catch (submitError) {
      Alert.alert('Error', getErrorMessage(submitError, 'No se pudo editar la cuenta del personal.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmToggleStatus = (user: User): void => {
    const active = isActive(user);
    const title = active ? 'Desactivar personal' : 'Reactivar personal';
    const message = active
      ? `El usuario ${user.nombre} no podra iniciar sesion hasta que sea reactivado.`
      : `El usuario ${user.nombre} podra iniciar sesion nuevamente.`;

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: active ? 'Desactivar' : 'Reactivar',
        style: active ? 'destructive' : 'default',
        onPress: () => {
          void toggleStatus(user);
        },
      },
    ]);
  };

  const toggleStatus = async (user: User): Promise<void> => {
    try {
      setActionLoadingUid(user.uid);
      if (isActive(user)) {
        await desactivarPersonal(user.uid);
      } else {
        await reactivarPersonal(user.uid);
      }
    } catch (statusError) {
      Alert.alert('Error', getErrorMessage(statusError, 'No se pudo actualizar el estado del usuario.'));
    } finally {
      setActionLoadingUid(null);
    }
  };

  const sendTestNotification = async (): Promise<void> => {
    try {
      setTestNotificationLoading(true);
      await enviarNotificacionPrueba();
      Alert.alert('Notificacion enviada', 'Revisa la bandeja de notificaciones del dispositivo.');
    } catch (notificationError) {
      Alert.alert('Error', getErrorMessage(notificationError, 'No se pudo enviar la notificacion de prueba.'));
    } finally {
      setTestNotificationLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.backdrop} onPress={closeModal} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>{editingUser ? 'Actualizar acceso' : 'Nuevo acceso'}</Text>
              <Text style={styles.sheetTitle}>{editingUser ? 'Editar personal' : 'Crear personal'}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} activeOpacity={0.75} onPress={closeModal}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {editingUser ? (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <ProfilePhotoPicker
                uri={profilePhotoUri ?? editingUser.fotoPerfilUrl}
                onPress={() => {
                  void pickProfilePhoto();
                }}
              />
              <FormField
                control={editControl}
                name="nombre"
                label="Nombre completo"
                placeholder="Nombre del personal"
                errorMessage={editErrors.nombre?.message}
              />
              <FormField
                control={editControl}
                name="email"
                label="Correo electronico"
                placeholder="personal@huellitas.org"
                keyboardType="email-address"
                autoCapitalize="none"
                errorMessage={editErrors.email?.message}
              />
              <FormField
                control={editControl}
                name="telefono"
                label="Telefono (opcional)"
                placeholder="0999999999"
                keyboardType="phone-pad"
                maxLength={10}
                errorMessage={editErrors.telefono?.message}
              />

              <TouchableOpacity
                style={styles.submitButton}
                activeOpacity={0.86}
                disabled={submitting}
                onPress={handleEditSubmit(submitEditPersonal)}
              >
                {submitting ? (
                  <LoadingIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color={Colors.white} />
                    <Text style={styles.submitButtonText}>Guardar cambios</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <ProfilePhotoPicker
              uri={profilePhotoUri}
              onPress={() => {
                void pickProfilePhoto();
              }}
            />
            <FormField
              control={control}
              name="nombre"
              label="Nombre completo"
              placeholder="Nombre del personal"
              errorMessage={errors.nombre?.message}
            />
            <FormField
              control={control}
              name="email"
              label="Correo electronico"
              placeholder="personal@huellitas.org"
              keyboardType="email-address"
              autoCapitalize="none"
              errorMessage={errors.email?.message}
            />
            <FormField
              control={control}
              name="telefono"
              label="Telefono (opcional)"
              placeholder="0999999999"
              keyboardType="phone-pad"
              maxLength={10}
              errorMessage={errors.telefono?.message}
            />
            <FormField
              control={control}
              name="password"
              label="Contrasena temporal"
              placeholder="Minimo 6 caracteres"
              secureTextEntry
              errorMessage={errors.password?.message}
            />
            <FormField
              control={control}
              name="confirmPassword"
              label="Confirmar contrasena"
              placeholder="Repite la contrasena"
              secureTextEntry
              errorMessage={errors.confirmPassword?.message}
            />

            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.86}
              disabled={submitting}
              onPress={handleSubmit(submitPersonal)}
            >
              {submitting ? (
                <LoadingIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Crear cuenta</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
          )}
        </View>
      </Modal>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <PersonalCard
            user={item}
            actionLoading={actionLoadingUid === item.uid}
            onEdit={openEditModal}
            onToggleStatus={confirmToggleStatus}
          />
        )}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Panel superadmin</Text>
            <Text style={styles.title}>Gestion de usuarios</Text>
            <Text style={styles.subtitle}>Crea, desactiva o reactiva cuentas del personal.</Text>
            <TouchableOpacity
              style={styles.testNotificationButton}
              activeOpacity={0.82}
              disabled={testNotificationLoading}
              onPress={() => {
                void sendTestNotification();
              }}
            >
              {testNotificationLoading ? (
                <LoadingIndicator size="small" color={Colors.accent} />
              ) : (
                <Ionicons name="notifications-outline" size={18} color={Colors.accent} />
              )}
              <Text style={styles.testNotificationText}>Enviar prueba de notificacion</Text>
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por nombre, correo o telefono..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.searchInput}
              />
              {search.length > 0 ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={42} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No hay personal</Text>
            <Text style={styles.emptyMessage}>Crea la primera cuenta para que aparezca en esta lista.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.86} onPress={openCreateModal}>
        <Ionicons name="person-add" size={26} color={Colors.white} />
      </TouchableOpacity>
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
    paddingBottom: 96,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  testNotificationButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.accent}12`,
    borderColor: Colors.accent,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  testNotificationText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    elevation: 2,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: `${Colors.primary}14`,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  cardTitleGroup: {
    flex: 1,
  },
  userName: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: FontSize.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
    paddingVertical: Spacing.md,
  },
  editButton: {
    backgroundColor: `${Colors.primary}10`,
    borderColor: Colors.primary,
  },
  editButtonText: {
    color: Colors.primary,
  },
  disableButton: {
    backgroundColor: `${Colors.error}10`,
    borderColor: Colors.error,
  },
  enableButton: {
    backgroundColor: `${Colors.secondary}12`,
    borderColor: Colors.secondary,
  },
  statusButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  disableButtonText: {
    color: Colors.error,
  },
  enableButtonText: {
    color: Colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  emptyMessage: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 999,
    bottom: Spacing.xl,
    elevation: 4,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.xl,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    width: 58,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    left: 0,
    maxHeight: '88%',
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    position: 'absolute',
    right: 0,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    height: 4,
    marginBottom: Spacing.lg,
    width: 40,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sheetEyebrow: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    borderColor: Colors.neutralLight,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.sm,
    minHeight: 54,
    paddingVertical: Spacing.lg,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  photoButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.accent,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  photoButtonText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
