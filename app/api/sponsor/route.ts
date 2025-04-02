// app/api/sponsor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Interface für die Anfrage-Daten
interface SponsorshipRequest {
  vorname: string;
  name: string;
  email: string;
  telefon: string;
  message: string;
  songDetails: {
    name: string;
    komponist: string;
    anzahl: number;
    preis: number;
    gesamtpreis: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Eingehende JSON-Daten parsen
    const data: SponsorshipRequest = await request.json();

    // Validierung der Daten
    if (!data.email || !data.name || !data.vorname || !data.telefon || !data.songDetails) {
      return NextResponse.json(
        { error: "Fehlende erforderliche Felder" },
        { status: 400 }
      );
    }

    // Prüfen, ob der Song bereits existiert (nach Name und Komponist)
    const song = await prisma.song.findFirst({
      where: { name: data.songDetails.name, komponist: data.songDetails.komponist },
    });

    // Falls der Song noch nicht existiert, neuen Song erstellen
    if (!song) {
      return NextResponse.json(
        { error: "Fehler bei der Bearbeitung der Sponsoring-Anfragem. Lied konnte nicht gefunden werden." },
        { status: 500 }
      );
    }

    // Sponsor in die Datenbank speichern
    const sponsor = await prisma.sponsor.create({
      data: {
        vorname: data.vorname,
        telefon: data.telefon,
        name: data.name,
        email: data.email,
        message: data.message,
        songId: song.id, // Verknüpfung mit dem Song
      },
    });

    // Anzahl der Bewerber um 1 erhöhen
    await prisma.song.update({
      where: { id: song.id },
      data: { bewerber: song.bewerber + 1 },
    });

    // E-Mail-Transporter konfigurieren
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.example.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "user@example.com",
        pass: process.env.SMTP_PASSWORD || "password",
      },
    });

    // E-Mail-Inhalt erstellen
    const emailContent = `
      <h1>Vielen Dank für Ihr Sponsoring!</h1>
      <p>Hallo ${data.vorname} ${data.name},</p>
      <p>Vielen Dank für Ihre Unterstützung. Wir haben Ihre Sponsoring-Anfrage für das folgende Lied erhalten:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Lied:</strong> ${song.name}</p>
        <p><strong>Komponist:</strong> ${song.komponist}</p>
        <p><strong>Anzahl:</strong> ${song.anzahl}</p>
        <p><strong>Preis pro Stück:</strong> ${song.preis.toFixed(2)} €</p>
        <p><strong>Gesamtbetrag:</strong> ${song.gesamtpreis.toFixed(2)} €</p>
      </div>
      
      <p>Ihre Nachricht an uns:</p>
      <p style="font-style: italic;">${data.message}</p>
    `;

    // Bestätigungs-E-Mail an den Sponsor senden
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@musiksponsoring.de",
      to: data.email,
      subject: `Bestätigung Ihres Sponsorings: ${song.name}`,
      html: emailContent,
    });

    // Interne Benachrichtigung an den Admin senden
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@musiksponsoring.de",
      to: process.env.ADMIN_EMAIL || "admin@musiksponsoring.de",
      subject: `Neue Sponsoring-Anfrage: ${song.name}`,
      html: `
        <h2>Neue Sponsoring-Anfrage</h2>
        <p><strong>Von:</strong> ${data.vorname} ${data.name}</p>
        <p><strong>E-Mail:</strong> ${data.email}</p>
        <p><strong>Telefon:</strong> ${data.telefon}</p>
        <p><strong>Lied:</strong> ${song.name} von ${song.komponist}</p>
        <p><strong>Gesamtbetrag:</strong> ${song.gesamtpreis.toFixed(2)} €</p>
        <p><strong>Nachricht:</strong> ${data.message}</p>
      `,
    });

    return NextResponse.json({ success: true, sponsorId: sponsor.id });
  } catch (error) {
    console.error("Fehler beim Speichern oder Versenden der E-Mail:", error);
    return NextResponse.json(
      { error: "Fehler bei der Bearbeitung der Sponsoring-Anfrage" },
      { status: 500 }
    );
  }
}
