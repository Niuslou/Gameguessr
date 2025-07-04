import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Button,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { clearAllTips, getAllTips } from "../lib/storage";


interface Tip {
  homeGoals: number;
  awayGoals: number;
  match?: any; // optional gespeichertes Match
}

interface TipWithMatch {
  id: string;
  tip: Tip;
  match: any;
}

export default function TippOverview() {
  const [tipps, setTipps] = useState<TipWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');

  useFocusEffect(
    useCallback(() => {
      loadTips();
    }, [])
  );

  const loadTips = async () => {
    setLoading(true);
    try {
      const allTips = await getAllTips();
      console.log('DEBUG Tippübersicht: allTips', allTips);
      // Mapping: Immer ein Objekt mit id und tip, match kann fehlen
      const entries = Object.entries(allTips).map(([matchId, tip]) => {
        // Robust: match kann fehlen
        const match = (tip as any).match ? (tip as any).match : null;
        return { id: matchId, tip, match };
      });
      // Sortierung: Zuerst alle mit gültigem Datum (neueste oben), dann die ohne Datum
      const sorted = entries.sort((a, b) => {
        const dateA = a.match && a.match.utcDate ? new Date(a.match.utcDate).getTime() : 0;
        const dateB = b.match && b.match.utcDate ? new Date(b.match.utcDate).getTime() : 0;
        // Tipps ohne Datum kommen nach hinten
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA;
      });
      setTipps(sorted);
    } catch (err) {
      console.error("Fehler beim Laden der Tipps", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearAllTips();
    setTipps([]);
  };

  // Teams aus Tipps extrahieren
  const allTeams = Array.from(
    new Set(
      tipps.flatMap(({ match }) =>
        match ? [match.homeTeam?.name, match.awayTeam?.name] : []
      )
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  // Tipps nach Team filtern
  const filteredTipps = selectedTeam === 'ALL'
    ? tipps
    : tipps.filter(({ match }) =>
        match && (match.homeTeam?.name === selectedTeam || match.awayTeam?.name === selectedTeam)
      );

  // Statistik berechnen
  const total = tipps.length;
  const exact = tipps.filter(({ match, tip }) =>
    match.status === "FINISHED" &&
    tip.homeGoals === match.score.fullTime.home &&
    tip.awayGoals === match.score.fullTime.away
  ).length;
  const finished = tipps.filter(({ match }) => match.status === "FINISHED").length;
  const wrong = finished - exact;
  const open = total - finished;

  // Tendenz richtig: Gewinner (oder Unentschieden) stimmt, aber nicht das exakte Ergebnis
  const tendency = tipps.filter(({ match, tip }) => {
    if (match.status !== "FINISHED") return false;
    const realDiff = match.score.fullTime.home - match.score.fullTime.away;
    const tipDiff = tip.homeGoals - tip.awayGoals;
    // Exakt richtig zählt nicht als Tendenz
    if (tip.homeGoals === match.score.fullTime.home && tip.awayGoals === match.score.fullTime.away) return false;
    // Beide Unentschieden
    if (realDiff === 0 && tipDiff === 0) return true;
    // Beide Heimsieg
    if (realDiff > 0 && tipDiff > 0) return true;
    // Beide Auswärtssieg
    if (realDiff < 0 && tipDiff < 0) return true;
    return false;
  }).length;

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Deine Tipps</Text>
      {/* Dropdown für Team-Auswahl */}
      <View style={{ marginBottom: 16 }}>
        <Picker
          selectedValue={selectedTeam}
          onValueChange={setSelectedTeam}
          style={{ backgroundColor: '#f2f2f2', borderRadius: 8 }}
        >
          <Picker.Item label="Alle Teams" value="ALL" />
          {allTeams.map((team) => (
            <Picker.Item key={team} label={team} value={team} />
          ))}
        </Picker>
      </View>
      {/* Statistik und Tipps-Liste wie gehabt, aber mit filteredTipps */}
      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Statistik</Text>
        <Text>Getippte Spiele: {filteredTipps.length}</Text>
        <Text>Exakt richtig: {filteredTipps.filter(({ match, tip }) =>
          match && match.status === "FINISHED" &&
          tip.homeGoals === match.score.fullTime.home &&
          tip.awayGoals === match.score.fullTime.away
        ).length}</Text>
        <Text>Sieger richtig: {filteredTipps.filter(({ match, tip }) => {
          if (!match || match.status !== "FINISHED") return false;
          const realDiff = match.score.fullTime.home - match.score.fullTime.away;
          const tipDiff = tip.homeGoals - tip.awayGoals;
          if (tip.homeGoals === match.score.fullTime.home && tip.awayGoals === match.score.fullTime.away) return false;
          if (realDiff === 0 && tipDiff === 0) return true;
          if (realDiff > 0 && tipDiff > 0) return true;
          if (realDiff < 0 && tipDiff < 0) return true;
          return false;
        }).length}</Text>
        <Text>Falsch: {filteredTipps.filter(({ match }) => match && match.status === "FINISHED").length - filteredTipps.filter(({ match, tip }) =>
          match && match.status === "FINISHED" &&
          tip.homeGoals === match.score.fullTime.home &&
          tip.awayGoals === match.score.fullTime.away
        ).length}</Text>
        <Text>Offen: {filteredTipps.length - filteredTipps.filter(({ match }) => match && match.status === "FINISHED").length}</Text>
      </View>
      <Button title="Alle Tipps löschen" onPress={handleClear} />
      {filteredTipps.length === 0 ? (
        <Text>Keine Tipps gefunden.</Text>
      ) : (
        <>
          {filteredTipps.slice(0, visibleCount).map(({ id, tip, match }) => {
            if (!match) return null;
            const date = new Date(match.utcDate);
            const finished = match.status === "FINISHED";
            const correct =
              finished &&
              tip.homeGoals === match.score.fullTime.home &&
              tip.awayGoals === match.score.fullTime.away;

            return (
              <View key={id} style={styles.tipBox}>
                <Text style={styles.teams}>
                  {match.homeTeam.name} vs. {match.awayTeam.name}
                </Text>
                <Text style={styles.date}>{date.toLocaleString()}</Text>
                <Text style={styles.tip}>
                  Dein Tipp: {tip.homeGoals} : {tip.awayGoals}
                </Text>
                {finished ? (
                  <Text style={styles.result}>
                    Ergebnis: {match.score.fullTime.home} :{" "}
                    {match.score.fullTime.away}{" "}
                    {correct ? "✅" : "❌"}
                  </Text>
                ) : (
                  <Text style={{ color: "#888" }}>Spiel noch nicht gespielt</Text>
                )}
              </View>
            );
          })}
          {visibleCount < filteredTipps.length && (
            <Button
              title="Mehr anzeigen ▼"
              onPress={() => setVisibleCount((c) => c + 5)}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  statsBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  statsTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  tipBox: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
  },
  teams: {
    fontWeight: "bold",
    fontSize: 16,
  },
  date: {
    color: "#666",
    marginBottom: 6,
  },
  tip: {
    marginTop: 4,
  },
  result: {
    marginTop: 4,
    fontWeight: "bold",
  },
});
