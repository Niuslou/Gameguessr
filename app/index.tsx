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
                // Optional: Sort teams alphabetically by name
                const sortedData = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
                setTeams(sortedData);
            } catch (err) {
                setError("Fehler beim Laden der Teams. Bitte versuche es später noch einmal.");
            } finally {
                setLoading(false);
            }
        };

        loadTeams();
    }, []);

    // Loading and Error States with improved styling
    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3949ab" />
                <Text style={styles.loadingText}>Lade Bundesliga Teams...</Text>
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); setError(null); /* Recalling loadTeams might be needed here depending on your actual use case. */ }}>
                    <Text style={styles.retryButtonText}>Erneut versuchen</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>⚽ Bundesliga Teams</Text>
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
                // Add some padding to the bottom of the list for better scroll experience
                contentContainerStyle={styles.listContentContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f4f6fa", // Consistent light background
    },
    centeredContainer: { // For loading and error states
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#f4f6fa",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#607d8b',
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#d32f2f', // Red for error messages
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#3949ab',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28, // Larger title
        fontWeight: "bold",
        marginBottom: 25, // More space below title
        textAlign: "center",
        color: '#1a237e', // Darker blue for prominence
        letterSpacing: 1, // Slight letter spacing
    },
    listContentContainer: {
        paddingBottom: 20, // Add padding to the bottom of the FlatList
    },
    teamItem: {
        backgroundColor: "#fff", // White background for items
        paddingVertical: 15, // Increased vertical padding
        paddingHorizontal: 20, // Increased horizontal padding
        marginVertical: 8, // More vertical margin between items
        borderRadius: 12, // More rounded corners
        borderWidth: 1, // Subtle border
        borderColor: '#e8eaf6', // Light border color
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    teamName: {
        fontSize: 18, // Slightly larger font size
        color: '#263238', // Darker text color
        fontWeight: '500', // Medium font weight
    },
});