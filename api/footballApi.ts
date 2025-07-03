const API_BASE_URL = 'https://api.football-data.org/v4';
const API_TOKEN = 'd08839c0ce894782833a7e7fc208db54';

const headers = {
  'X-Auth-Token': API_TOKEN,
};

export async function fetchBundesligaTeams() {
  try {
    const response = await fetch(`${API_BASE_URL}/competitions/BL1/teams`, {
      headers,
    });
    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    console.error('Fehler beim Laden der Teams:', error);
    return [];
  }
}

export async function fetchTeamById(teamId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      headers,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fehler beim Laden der Teamdaten:', error);
    return null;
  }
}

export async function fetchTeamMatches(teamId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/matches`, {
      headers,
    });
    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Fehler beim Laden der Spieldaten:', error);
    return [];
  }
}

export async function fetchUpcomingBundesligaMatches(teamId: number) {
  const matches = await fetchTeamMatches(teamId);

  return matches
    .filter(
      (m) =>
        m.competition.code === 'BL1' &&
        new Date(m.utcDate) > new Date()
    )
    .sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    )
    .slice(0, 5);
}
