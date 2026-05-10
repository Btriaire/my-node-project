import { NextResponse } from "next/server";

export const revalidate = 60; // revalidate every 60s

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION = "FL1"; // Ligue 1

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/${COMPETITION}/standings`,
      {
        headers: { "X-Auth-Token": API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      throw new Error(`Football API error: ${res.status}`);
    }

    const data = await res.json();
    const table = data.standings?.[0]?.table ?? [];

    const standings = table.map((entry: FootballEntry) => ({
      position: entry.position,
      team: {
        id: entry.team.id,
        name: entry.team.name,
        shortName: entry.team.shortName,
        tla: entry.team.tla,
        crest: entry.team.crest,
      },
      playedGames: entry.playedGames,
      won: entry.won,
      draw: entry.draw,
      lost: entry.lost,
      points: entry.points,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst,
      goalDifference: entry.goalDifference,
      form: entry.form,
    }));

    return NextResponse.json({
      standings,
      season: data.season?.currentMatchday ?? null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Standings fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 });
  }
}

interface FootballEntry {
  position: number;
  team: { id: number; name: string; shortName: string; tla: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
}
