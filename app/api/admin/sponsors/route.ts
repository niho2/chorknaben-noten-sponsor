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

export async function GET(req: NextRequest) {

    const isAuthenticated = await checkAuth(req);

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Nicht autorisiert. Bitte einloggen." }, { status: 401 });
    }

  try {
    const sponsors = await prisma.sponsor.findMany({
      include: {
        song: true, // Holt sich die zugehörigen Songs
      },
    });
    return NextResponse.json(sponsors);
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Laden der Sponsoren: " + error }, { status: 500 });
  }
}
