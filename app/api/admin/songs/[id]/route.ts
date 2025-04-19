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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAuthenticated = await checkAuth(req);
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "Nicht autorisiert. Bitte einloggen." },
      { status: 401 }
    );
  }

  try {    
    const { id } = await params;
    const songId = parseInt(id);

    await prisma.song.delete({
      where: { id: songId },
    });

    return NextResponse.json({ message: "Song erfolgreich gelöscht" });
  } catch (error) {
    console.error("Error deleting song:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Songs" },
      { status: 500 }
    );
  }
}

// Song aktualisieren
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAuthenticated = await checkAuth(req);
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "Nicht autorisiert. Bitte einloggen." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const songId = parseInt(id);
    const data = await req.json();

    // Entferne leere oder null Werte, um nur vorhandene Felder zu aktualisieren
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== null && v !== '')
    );

    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: updateData,
    });

    return NextResponse.json(updatedSong);
  } catch (error) {
    console.error("Error updating song:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Songs" },
      { status: 500 }
    );
  }
}

