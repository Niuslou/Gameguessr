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
import {
  fetchTeamById,
  fetchTeamMatches,
} from "../../lib/api/footballApi";
import {
  getTip,
  storeTip,
} from "../../lib/storage/tipStorage";

export default function TeamDetails() {
  const { id } = useLocalSearchParams();
  const [team, setTeam] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [tips, setTips] = useState<Record<string, { home: string; away: string }>>({});

  useEffect(() => {
    if (id) {
      fetchTeamById(String(id)).then(setTeam);
      fetchTeamMatches(String(id)).then(setMatches);
    }
  }, [id]);

  const loadTips = async () => {
    if (!matches || matches.length === 0) return;
    const tipsMap: Record<string, { home: string; away: string }> = {};
    for (const match of matches) {
      const tip = await getTip(match.id.toString());
      if (tip) {
        tipsMap[match.id] = tip;
      }
    }
    setTips(tipsMap);
  };

  useEffect(() => {
    loadTips();
  }, [matches]);

  const now = new Date();

  const pastMatches = matches
    .filter((m) => new Date(m.utcDate) < now && m.status === "FINISHED")
    .slice(-5)
    .reverse();

  const upcomingMatches = matches
    .filter((m) => new Date(m.utcDate) >= now)
    .slice(0, 5);

  const handleTipChange = (
    matchId: string,
    team: "home" | "away",
    value: string
  ) => {
    setTips((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value,
      },
    }));
  };

  const saveTip = async (matchId: string) => {
    const tip = tips[matchId];
    if (!tip || tip.home === "" || tip.away === "") {
      Alert.alert("Fehler", "Bitte beide Tore eingeben.");
      return;
    }
    await storeTip(matchId, tip);
    Alert.alert("Gespeichert", "Tipp wurde gespeichert!");
  };

  if (!team) return <Text style={styles.loading}>Lade Teamdaten...</Text>;

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
        upcomingMatches.map((match) => {
          const tip = tips[match.id] || { home: "", away: "" };
          return (
            <View key={match.id} style={styles.matchContainer}>
              <Text style={styles.matchItem}>
                {match.homeTeam.name} vs. {match.awayTeam.name}
              </Text>
              <Text style={styles.matchDate}>
                {new Date(match.utcDate).toLocaleDateString()} –{" "}
                {new Date(match.utcDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <View style={styles.tipRow}>
                <TextInput
                  style={styles.tipInput}
                  keyboardType="number-pad"
                  placeholder="Heim"
                  value={tip.home}
                  onChangeText={(value) =>
                    handleTipChange(match.id.toString(), "home", value)
                  }
                />
                <Text style={{ marginHorizontal: 5 }}>:</Text>
                <TextInput
                  style={styles.tipInput}
                  keyboardType="number-pad"
                  placeholder="Gast"
                  value={tip.away}
                  onChangeText={(value) =>
                    handleTipChange(match.id.toString(), "away", value)
                  }
                />
                <Button
                  title="Tipp speichern"
                  onPress={() => saveTip(match.id.toString())}
                />
              </View>
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
  matchItem: { fontSize: 14 },
  matchDate: { marginBottom: 6, color: "#555" },
  matchContainer: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  tipInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    width: 50,
    textAlign: "center",
    borderRadius: 4,
  },
});
