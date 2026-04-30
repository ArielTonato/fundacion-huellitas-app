import { Ionicons } from '@expo/vector-icons';
import { usePlacesAutocomplete } from '@src/shared/hooks/usePlacesAutocomplete';
import type { PlaceDetails, PlacePrediction } from '@src/shared/services/places';
import { Colors } from '@src/theme/colors';
import { Spacing } from '@src/theme/spacing';
import { FontSize } from '@src/theme/typography';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface PlacesSearchInputProps {
  initialAddress?: string;
  locationBias?: { latitude: number; longitude: number } | null;
  onSelect: (selection: PlaceDetails & { placeId: string }) => void;
  placeholder?: string;
}

export function PlacesSearchInput({
  initialAddress = '',
  locationBias,
  onSelect,
  placeholder = 'Buscar dirección, calle o lugar',
}: PlacesSearchInputProps): React.JSX.Element {
  const [input, setInput] = useState(initialAddress);
  const [focused, setFocused] = useState(false);
  const [resolving, setResolving] = useState(false);

  const { predictions, loading, error, resolveDetails } = usePlacesAutocomplete({
    input,
    locationBias,
  });

  const showSuggestions = focused && (input.trim().length >= 2 || loading);

  const handleSelect = async (prediction: PlacePrediction): Promise<void> => {
    setResolving(true);
    try {
      const details = await resolveDetails(prediction.placeId);
      setInput(details.address || prediction.description);
      setFocused(false);
      onSelect({ ...details, placeId: prediction.placeId });
    } catch {
      // Surface to user via the parent if needed; keep UI usable.
    } finally {
      setResolving(false);
    }
  };

  const clearInput = (): void => {
    setInput('');
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay so the press on a suggestion still fires.
            setTimeout(() => setFocused(false), 120);
          }}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
        />
        {(loading || resolving) && (
          <ActivityIndicator size="small" color={Colors.primary} />
        )}
        {!loading && !resolving && input.length > 0 && (
          <TouchableOpacity onPress={clearInput} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={styles.dropdown}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : predictions.length === 0 && !loading ? (
            <Text style={styles.emptyText}>Sin resultados.</Text>
          ) : (
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                  onPress={() => handleSelect(item)}
                >
                  <Ionicons name="location-outline" size={18} color={Colors.primary} />
                  <View style={styles.itemTextBlock}>
                    <Text style={styles.itemMain} numberOfLines={1}>
                      {item.mainText}
                    </Text>
                    {item.secondaryText ? (
                      <Text style={styles.itemSecondary} numberOfLines={1}>
                        {item.secondaryText}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 20,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.neutralMid,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.xs,
  },
  dropdown: {
    backgroundColor: Colors.white,
    borderColor: Colors.neutralLight,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 6,
    left: 0,
    marginTop: Spacing.xs,
    maxHeight: 240,
    paddingVertical: Spacing.xs,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    top: '100%',
    zIndex: 30,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  itemPressed: {
    backgroundColor: Colors.neutralLight,
  },
  itemTextBlock: {
    flex: 1,
  },
  itemMain: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  itemSecondary: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
