import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchBundesligaTeams } from "../api/footballApi";

export default function Home() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await fetchBundesligaTeams();
        setTeams(data);
      } catch (err) {
        setError("Fehler beim Laden der Teams");
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;
  if (error) return <Text style={{ marginTop: 40 }}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bundesliga Teams</Text>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.teamItem}
            onPress={() => router.push(`/team/${item.id}`)}
          >
            <Text style={styles.teamName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  teamItem: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
  },
  teamName: { fontSize: 16 },
});
