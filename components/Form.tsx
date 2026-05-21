import { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#7b8792"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  children,
  disabled,
  loading,
  onPress
}: PropsWithChildren<{ disabled?: boolean; loading?: boolean; onPress: () => void }>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={StyleSheet.flatten([styles.primaryButton, (disabled || loading) && styles.disabledButton])}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{children}</Text>}
    </Pressable>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  field: {
    gap: 6
  },
  label: {
    color: "#415466",
    fontSize: 14,
    fontWeight: "700"
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cdd7c8",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2933",
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 12
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f6f4e",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  disabledButton: {
    opacity: 0.65
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dfd4",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18
  },
  error: {
    color: "#b42318",
    fontSize: 14,
    fontWeight: "700"
  }
});
