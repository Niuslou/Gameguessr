// app/team/[id].tsx

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
import { getTip, saveTip } from "../../lib/storage";

export default function TeamDetails() {
  const { id } = useLocalSearchParams();
  const [team, setTeam] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [tips, setTips] = useState<Record<string, { homeGoals: number; awayGoals: number }>>({});
  const [inputValues, setInputValues] = useState<Record<string, { home: string; away: string }>>({});

  useEffect(() => {
    if (id) {
      fetchTeamById(String(id)).then(setTeam);
      fetchTeamMatches(String(id)).then(setMatches);
    }
  }, [id]);

  useEffect(() => {
    const loadTips = async () => {
      const result: Record<string, { homeGoals: number; awayGoals: number }> = {};
      for (const match of matches) {
        const saved = await getTip(match.id.toString());
        if (saved) {
          result[match.id.toString()] = saved;
        }
      }
      setTips(result);
    };
    loadTips();
  }, [matches]);

  const handleTipChange = (matchId: string, teamType: "home" | "away", value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [teamType]: value,
      },
    }));
  };

  const submitTip = async (matchId: string) => {
    const input = inputValues[matchId];
    if (!input || input.home === "" || input.away === "") {
      Alert.alert("Fehler", "Bitte gib beide Tore ein.");
      return;
    }

    // Das Match-Objekt zu dieser ID finden
    const match = matches.find((m) => m.id.toString() === matchId);
    await saveTip(matchId, Number(input.home), Number(input.away), match);

    if (!match) {
      Alert.alert("Warnung", "Achtung: Für diese Match-ID wurde kein Spiel gefunden!");
    } else {
      Alert.alert("Gespeichert", "Dein Tipp wurde gespeichert.");
    }

    setTips((prev) => ({
      ...prev,
      [matchId]: { homeGoals: Number(input.home), awayGoals: Number(input.away) }
    }));
  };

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

      <Text style={styles.sectionTitle}>Nächste 5 Spiele (mit Tippfunktion)</Text>
      {upcomingMatches.length > 0 ? (
        upcomingMatches.map((match) => {
          const matchId = match.id.toString();
          const savedTip = tips[matchId];

          return (
            <View key={match.id} style={styles.tipContainer}>
              <Text style={styles.matchItem}>
                {match.homeTeam.name} vs. {match.awayTeam.name}
                {"\n"}
                {new Date(match.utcDate).toLocaleDateString()} –{" "}
                {new Date(match.utcDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="Heim"
                  keyboardType="numeric"
                  value={inputValues[matchId]?.home || ""}
                  onChangeText={(text) => handleTipChange(matchId, "home", text)}
                  style={styles.input}
                />
                <Text style={{ marginHorizontal: 4 }}>:</Text>
                <TextInput
                  placeholder="Gast"
                  keyboardType="numeric"
                  value={inputValues[matchId]?.away || ""}
                  onChangeText={(text) => handleTipChange(matchId, "away", text)}
                  style={styles.input}
                />
              </View>
              <Button title="Tipp speichern" onPress={() => submitTip(matchId)} />
              {savedTip && (
                <Text style={styles.savedTip}>
                  Dein Tipp: {savedTip.homeGoals} : {savedTip.awayGoals}
                </Text>
              )}
            </View>
          );
        })
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
  tipContainer: { marginBottom: 20 },
  inputRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    width: 50,
    textAlign: "center",
    borderRadius: 4,
  },
  savedTip: {
    marginTop: 4,
    fontStyle: "italic",
    fontSize: 13,
    color: "green",
  },
});
