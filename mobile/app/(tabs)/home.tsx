import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="medkit" size={64} color="#0B6E4F" />
      <Text style={styles.title}>PharmaCloud</Text>
      <Text style={styles.subtitle}>Votre pharmacie en poche</Text>

      <View style={styles.grid}>
        {[
          { icon: "storefront", label: "Boutique" },
          { icon: "alarm", label: "Rappels" },
          { icon: "receipt", label: "Commandes" },
          { icon: "chatbubble-ellipses", label: "Assistant IA" },
        ].map((item) => (
          <View key={item.label} style={styles.card}>
            <Ionicons name={item.icon as any} size={28} color="#0B6E4F" />
            <Text style={styles.cardLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFB", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#0B6E4F", marginTop: 12 },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16, marginTop: 40 },
  card: { width: 140, height: 100, backgroundColor: "#fff", borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardLabel: { marginTop: 8, fontSize: 12, fontWeight: "500", color: "#0F172A" },
});
