import { Ionicons } from '@expo/vector-icons';
import { crearEntrevista } from '@src/modules/adopcion/services/entrevistasService';
import { obtenerSolicitud } from '@src/modules/adopcion/services/solicitudesService';
import { EmptyState } from '@src/shared/components/EmptyState';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import type { Solicitud } from '@src/shared/types/models';
import { Colors } from '@src/theme/colors';
import { FontSize } from '@src/theme/typography';
import { Spacing } from '@src/theme/spacing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CalendarDay {
  date: Date;
  key: string;
  label: string;
}

const WEEK_DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStartOfToday(): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getCalendarDays(monthDate: Date): Array<CalendarDay | null> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const emptyDays = Array.from({ length: firstDay.getDay() }, () => null);
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);

    return {
      date,
      key: getLocalDateKey(date),
      label: String(index + 1),
    };
  });

  return [...emptyDays, ...monthDays];
}

export default function AgendarEntrevistaScreen(): React.JSX.Element {
  const router = useRouter();
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fecha, setFecha] = useState<string>('');
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(getStartOfToday());
  const [hora, setHora] = useState<string>('');
  const [timeVisible, setTimeVisible] = useState<boolean>(false);
  const [selectedHour, setSelectedHour] = useState<string>('09');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [notas, setNotas] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSolicitud(): Promise<void> {
      if (!solicitudId) {
        setLoading(false);
        return;
      }

      try {
        const loadedSolicitud = await obtenerSolicitud(solicitudId);
        if (active) setSolicitud(loadedSolicitud);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSolicitud();
    return () => {
      active = false;
    };
  }, [solicitudId]);

  const submit = async (): Promise<void> => {
    setError(null);

    if (!solicitudId || !fecha || !hora) {
      setError('Ingrese fecha y hora para agendar la entrevista.');
      return;
    }

    const fechaEntrevista = new Date(`${fecha}T${hora}:00`);

    if (Number.isNaN(fechaEntrevista.getTime()) || fechaEntrevista <= new Date()) {
      setError('La fecha y hora deben ser futuras.');
      return;
    }

    setSubmitting(true);
    try {
      await crearEntrevista(solicitudId, { fecha: fechaEntrevista, hora, notas });
      Alert.alert('Entrevista agendada', 'La entrevista fue registrada correctamente.');
      router.replace('/(personal)/(tabs)/entrevistas' as never);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo agendar la entrevista.');
    } finally {
      setSubmitting(false);
    }
  };

  const today = getStartOfToday();
  const calendarDays = getCalendarDays(calendarMonth);
  const previousMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  const canGoToPreviousMonth = previousMonth >= new Date(today.getFullYear(), today.getMonth(), 1);

  const selectDate = (date: Date): void => {
    setFecha(getLocalDateKey(date));
    setCalendarVisible(false);
  };

  const confirmTime = (): void => {
    setHora(`${selectedHour}:${selectedMinute}`);
    setTimeVisible(false);
  };

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!solicitud) {
    return <EmptyState title="Solicitud no encontrada" message="No se pudo cargar la solicitud para agendar." />;
  }

  return (
    <>
      <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.calendarBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={[styles.calendarNavButton, !canGoToPreviousMonth ? styles.disabledButton : null]}
                activeOpacity={0.86}
                disabled={!canGoToPreviousMonth}
                onPress={() => setCalendarMonth(previousMonth)}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.calendarNavButton}
                activeOpacity={0.86}
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              >
                <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayButton} />;
                }

                const isPast = day.date < today;
                const selected = day.key === fecha;

                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayButton,
                      selected ? styles.dayButtonSelected : null,
                      isPast ? styles.dayButtonDisabled : null,
                    ]}
                    activeOpacity={0.86}
                    disabled={isPast}
                    onPress={() => selectDate(day.date)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected ? styles.dayTextSelected : null,
                        isPast ? styles.dayTextDisabled : null,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.calendarCancelButton} activeOpacity={0.86} onPress={() => setCalendarVisible(false)}>
              <Text style={styles.calendarCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={timeVisible} transparent animationType="fade" onRequestClose={() => setTimeVisible(false)}>
        <View style={styles.calendarBackdrop}>
          <View style={styles.timeCard}>
            <Text style={styles.calendarTitle}>Seleccionar hora</Text>
            <View style={styles.timePickerRow}>
              <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                {HOURS.map((hour) => {
                  const selected = hour === selectedHour;

                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[styles.timeOption, selected ? styles.timeOptionSelected : null]}
                      activeOpacity={0.86}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[styles.timeOptionText, selected ? styles.timeOptionTextSelected : null]}>{hour}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.timeSeparator}>:</Text>
              <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                {MINUTES.map((minute) => {
                  const selected = minute === selectedMinute;

                  return (
                    <TouchableOpacity
                      key={minute}
                      style={[styles.timeOption, selected ? styles.timeOptionSelected : null]}
                      activeOpacity={0.86}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[styles.timeOptionText, selected ? styles.timeOptionTextSelected : null]}>{minute}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.timeConfirmButton} activeOpacity={0.86} onPress={confirmTime}>
              <Text style={styles.timeConfirmText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calendarCancelButton} activeOpacity={0.86} onPress={() => setTimeVisible(false)}>
              <Text style={styles.calendarCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Agendar entrevista</Text>
      <Text style={styles.subtitle}>Define una fecha para entrevistar a {solicitud.nombreCompleto}.</Text>

      {solicitud.viveAcompanado ? (
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color={Colors.accent} />
          <Text style={styles.warningText}>
            El adoptante vive acompañado. Debe asistir con al menos una persona mayor de 18 años que conviva con el/ella.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity style={styles.dateButton} activeOpacity={0.86} onPress={() => setCalendarVisible(true)}>
          <Text style={[styles.dateButtonText, !fecha ? styles.datePlaceholder : null]}>
            {fecha || 'Seleccionar fecha'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.label}>Hora</Text>
        <TouchableOpacity style={styles.dateButton} activeOpacity={0.86} onPress={() => setTimeVisible(true)}>
          <Text style={[styles.dateButtonText, !hora ? styles.datePlaceholder : null]}>
            {hora || 'Seleccionar hora'}
          </Text>
          <Ionicons name="time-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.label}>Notas</Text>
        <TextInput
          value={notas}
          onChangeText={setNotas}
          placeholder="Indicaciones para la entrevista"
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={[styles.input, styles.textarea]}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.submitButton} disabled={submitting} activeOpacity={0.86} onPress={submit}>
        {submitting ? (
          <LoadingIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="calendar-outline" size={20} color={Colors.white} />
            <Text style={styles.submitText}>Agendar entrevista</Text>
          </>
        )}
      </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  backButton: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  title: { color: Colors.primary, fontSize: FontSize.xxxl, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22, marginBottom: Spacing.lg, marginTop: Spacing.sm },
  warningBox: {
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  warningText: { color: Colors.textPrimary, flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 18, marginBottom: Spacing.lg, padding: Spacing.lg },
  label: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.neutralLight,
    borderRadius: 12,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dateButton: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dateButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  datePlaceholder: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  textarea: { minHeight: 110 },
  errorText: { color: Colors.error, fontSize: FontSize.sm, marginBottom: Spacing.md, textAlign: 'center' },
  submitButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 14, flexDirection: 'row', gap: 8, minHeight: 56, justifyContent: 'center' },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  calendarBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 31, 46, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: Spacing.lg,
    width: '100%',
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  calendarTitle: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  calendarNavButton: {
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  disabledButton: {
    opacity: 0.38,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekDay: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  dayButtonDisabled: {
    opacity: 0.35,
  },
  dayText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: Colors.white,
  },
  dayTextDisabled: {
    color: Colors.textSecondary,
  },
  calendarCancelButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  calendarCancelText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  timeCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: Spacing.lg,
    width: '100%',
  },
  timePickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  timeColumn: {
    backgroundColor: Colors.neutralLight,
    borderRadius: 18,
    flex: 1,
    maxHeight: 220,
    paddingVertical: Spacing.sm,
  },
  timeOption: {
    alignItems: 'center',
    borderRadius: 14,
    marginHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  timeOptionSelected: {
    backgroundColor: Colors.primary,
  },
  timeOptionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  timeOptionTextSelected: {
    color: Colors.white,
  },
  timeSeparator: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  timeConfirmButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
  },
  timeConfirmText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
