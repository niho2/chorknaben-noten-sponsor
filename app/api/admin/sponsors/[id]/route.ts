import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

async function checkAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return !!token; // Return true if token exists, false otherwise
}

// Sponsor löschen
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAuthenticated = await checkAuth(req);
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "Nicht autorisiert. Bitte einloggen." },
      { status: 401 }
    );
  }

  try {
    const sponsorId = parseInt(params.id);

    // Sponsor zuerst finden, um die songId zu bekommen und sicherzustellen, dass er existiert
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { songId: true } // Nur die songId wird benötigt
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor nicht gefunden." }, { status: 404 });
    }

    // Sponsor löschen
    await prisma.sponsor.delete({
      where: { id: sponsorId },
    });

    // Bewerberzahl beim zugehörigen Song dekrementieren
    // Verwende updateMany, falls der Song bereits gelöscht wurde (weniger kritisch)
    await prisma.song.updateMany({
      where: { 
        id: sponsor.songId,
        bewerber: { gt: 0 } // Nur dekrementieren, wenn größer 0
      },
      data: { bewerber: { decrement: 1 } },
    });

    return NextResponse.json({ message: "Sponsor erfolgreich gelöscht" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting sponsor:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Sponsors" },
      { status: 500 }
    );
  }
} 