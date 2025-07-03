import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

export default function TeamCard({ team }: { team: any }) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/team/${team.id}`)} style={styles.card}>
      <Text style={styles.name}>{team.name}</Text>
      <Text style={styles.short}>{team.shortName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  short: {
    fontSize: 14,
    color: "#666",
  },
});
