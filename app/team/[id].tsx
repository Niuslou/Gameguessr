import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { fetchTeamById, fetchTeamMatches } from "../../api/footballApi";

export default function TeamDetails() {
  const { id } = useLocalSearchParams();
  const [team, setTeam] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchTeamById(String(id)).then(setTeam);
      fetchTeamMatches(String(id)).then(setMatches);
    }
  }, [id]);

  if (!team) return <Text style={styles.loading}>Lade Teamdaten...</Text>;

  const now = new Date();

  const pastMatches = matches
    .filter((m) => new Date(m.utcDate) < now && m.status === "FINISHED")
    .slice(-5)
    .reverse();

  const upcomingMatches = matches
    .filter((m) => new Date(m.utcDate) >= now)
    .slice(0, 5);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{team.name}</Text>

      <Text style={styles.sectionTitle}>Letzte 5 Spiele</Text>
      {pastMatches.length > 0 ? (
        pastMatches.map((match) => (
          <Text key={match.id} style={styles.matchItem}>
            {match.homeTeam.name} {match.score.fullTime.home} : {match.score.fullTime.away} {match.awayTeam.name}
          </Text>
        ))
      ) : (
        <Text>Keine vergangenen Spiele gefunden.</Text>
      )}

      <Text style={styles.sectionTitle}>Nächste 5 Spiele</Text>
      {upcomingMatches.length > 0 ? (
        upcomingMatches.map((match) => (
          <Text key={match.id} style={styles.matchItem}>
            {match.homeTeam.name} vs. {match.awayTeam.name}{"\n"}
            {new Date(match.utcDate).toLocaleDateString()} –{" "}
            {new Date(match.utcDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ))
      ) : (
        <Text>Keine bevorstehenden Spiele gefunden.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  loading: { marginTop: 50, textAlign: "center" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  matchItem: { marginBottom: 8, fontSize: 14 },
});
