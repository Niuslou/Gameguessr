import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchTeamById, fetchTeamMatches } from "../../api/footballApi";

export default function TeamDetails() {
  const { id } = useLocalSearchParams();
  const [team, setTeam] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<{
    [matchId: number]: { home: string; away: string };
  }>({});

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

  const handlePredictionChange = (
    matchId: number,
    teamType: "home" | "away",
    value: string
  ) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [teamType]: value,
      },
    }));
  };

  const handleSubmitPrediction = (matchId: number) => {
    const pred = predictions[matchId];
    if (!pred || pred.home === "" || pred.away === "") {
      Alert.alert("Fehler", "Bitte beide Tore eingeben.");
      return;
    }
    Alert.alert(
      "Tipp gespeichert",
      `Du hast getippt: ${pred.home} : ${pred.away}`
    );
    // Option: Lokale Speicherung oder Backend-Integration
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{team.name}</Text>

      <Text style={styles.sectionTitle}>Letzte 5 Spiele</Text>
      {pastMatches.length > 0 ? (
        pastMatches.map((match) => (
          <Text key={match.id} style={styles.matchItem}>
            {match.homeTeam.name} {match.score.fullTime.home} :{" "}
            {match.score.fullTime.away} {match.awayTeam.name}
          </Text>
        ))
      ) : (
        <Text>Keine vergangenen Spiele gefunden.</Text>
      )}

      <Text style={styles.sectionTitle}>Nächste 5 Spiele</Text>
      {upcomingMatches.length > 0 ? (
        upcomingMatches.map((match) => (
          <View key={match.id} style={styles.matchCard}>
            <Text style={styles.matchItem}>
              {match.homeTeam.name} vs. {match.awayTeam.name}
            </Text>
            <Text style={styles.dateText}>
              {new Date(match.utcDate).toLocaleDateString()} –{" "}
              {new Date(match.utcDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            <View style={styles.tipRow}>
              <TextInput
                style={styles.input}
                placeholder="Tore Heim"
                keyboardType="numeric"
                value={predictions[match.id]?.home || ""}
                onChangeText={(value) =>
                  handlePredictionChange(match.id, "home", value)
                }
              />
              <Text style={{ marginHorizontal: 8 }}>:</Text>
              <TextInput
                style={styles.input}
                placeholder="Tore Auswärts"
                keyboardType="numeric"
                value={predictions[match.id]?.away || ""}
                onChangeText={(value) =>
                  handlePredictionChange(match.id, "away", value)
                }
              />
            </View>

            <Button
              title="Tipp speichern"
              onPress={() => handleSubmitPrediction(match.id)}
            />
          </View>
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
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  matchItem: { marginBottom: 4, fontSize: 14, fontWeight: "600" },
  matchCard: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  dateText: { marginBottom: 8, fontSize: 12, color: "#555" },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 6,
    width: 70,
    textAlign: "center",
    backgroundColor: "#fff",
  },
});
