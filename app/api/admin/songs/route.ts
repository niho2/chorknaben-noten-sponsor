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

// Alle Songs inkl. Sponsoren abrufen (nur für eingeloggte Benutzer)
export async function GET(req: NextRequest) {
  const isAuthenticated = await checkAuth(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nicht autorisiert. Bitte einloggen." }, { status: 401 });
  }

  try {
    const songs = await prisma.song.findMany({
      include: { sponsors: true }, // Sponsoren werden mit angezeigt
    });

    return NextResponse.json(songs);
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Songs" },
      { status: 500 }
    );
  }
}

// Neuen Song hinzufügen (nur für eingeloggte Benutzer)
export async function POST(req: NextRequest) {
  const isAuthenticated = await checkAuth(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nicht autorisiert. Bitte einloggen." }, { status: 401 });
  }

  try {
    const data = await req.json();
    const song = await prisma.song.create({ data });

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Songs" },
      { status: 500 }
    );
  }
}
