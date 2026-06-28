import { View, Text, StyleSheet } from "react-native";

export default function CommandesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes commandes</Text>
      <Text style={styles.desc}>Suivez l'état de vos commandes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFB" },
  title: { fontSize: 20, fontWeight: "bold", color: "#0F172A" },
  desc: { fontSize: 14, color: "#64748B", marginTop: 4 },
});
