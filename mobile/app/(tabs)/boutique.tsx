import { View, Text, StyleSheet } from "react-native";

export default function BoutiqueScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Boutique en ligne</Text>
      <Text style={styles.desc}>Catalogue des produits disponibles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFB" },
  title: { fontSize: 20, fontWeight: "bold", color: "#0F172A" },
  desc: { fontSize: 14, color: "#64748B", marginTop: 4 },
});
