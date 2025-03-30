import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const songs = await prisma.song.findMany({
      include: { sponsors: false }, // Versteckt Sponsoren-Infos
    });

    return NextResponse.json(songs);
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Songs" },
      { status: 500 }
    );
  }
}
