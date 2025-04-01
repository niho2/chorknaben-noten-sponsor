import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

async function checkAuth(req: NextRequest) {
  // Token aus den Cookies extrahieren (NextAuth speichert das Token standardmäßig in den Cookies)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // Überprüfen, ob der Token existiert
  if (!token) {
    return false;
  }

  return true;
}

export async function POST(req: NextRequest) {
  const isAuthenticated = await checkAuth(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nicht autorisiert. Bitte einloggen." }, { status: 401 });
  }

  try {
    const songs = await req.json();
    
    // Überprüfen, ob es sich um ein Array handelt
    if (!Array.isArray(songs)) {
      return NextResponse.json(
        { error: "Ungültiges Format. Erwartet wird ein Array von Songs." },
        { status: 400 }
      );
    }

    // Validierung der Songs
    const invalidSongs = songs.filter(song => 
      !song.name || 
      !song.komponist || 
      typeof song.anzahl !== 'number' || 
      typeof song.preis !== 'number' || 
      typeof song.gesamtpreis !== 'number'
    );

    if (invalidSongs.length > 0) {
      return NextResponse.json(
        { error: "Ungültige Daten in einigen Songs gefunden." },
        { status: 400 }
      );
    }

    // Füge bewerber: 0 zu jedem Song hinzu
    const songsWithBewerber = songs.map(song => ({
      ...song,
      bewerber: 0
    }));

    // Bulk-Create mit Prisma
    const createdSongs = await prisma.song.createMany({
      data: songsWithBewerber      
    });

    return NextResponse.json({
      message: `${createdSongs.count} Songs erfolgreich erstellt`,
      count: createdSongs.count
    }, { status: 201 });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Songs" },
      { status: 500 }
    );
  }
}