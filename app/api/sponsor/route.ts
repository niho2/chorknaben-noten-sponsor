// First, let's create the API endpoint in app/api/sponsor/route.ts

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Define interface for the form data
interface SponsorshipRequest {
  name: string;
  email: string;
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
    // Parse the incoming request body
    const data: SponsorshipRequest = await request.json();
    
    // Validate the required fields
    if (!data.email || !data.name || !data.songDetails) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASSWORD || 'password',
      },
    });
    
    // Create the email content
    const emailContent = `
      <h1>Vielen Dank für Ihr Sponsoring!</h1>
      <p>Hallo ${data.name},</p>
      <p>Vielen Dank für Ihre Unterstützung. Wir haben Ihre Sponsoring-Anfrage für das folgende Lied erhalten:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Lied:</strong> ${data.songDetails.name}</p>
        <p><strong>Komponist:</strong> ${data.songDetails.komponist}</p>
        <p><strong>Anzahl:</strong> ${data.songDetails.anzahl}</p>
        <p><strong>Preis pro Stück:</strong> ${data.songDetails.preis.toFixed(2)} €</p>
        <p><strong>Gesamtbetrag:</strong> ${data.songDetails.gesamtpreis.toFixed(2)} €</p>
      </div>
      
      <p>Ihre Nachricht an uns:</p>
      <p style="font-style: italic;">${data.message}</p>
            
      
    `;
    
    // Send the confirmation email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@musiksponsoring.de',
      to: data.email,
      subject: `Bestätigung Ihres Sponsorings: ${data.songDetails.name}`,
      html: emailContent,
    });
    
    // Send an internal notification email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@musiksponsoring.de',
      to: process.env.ADMIN_EMAIL || 'admin@musiksponsoring.de',
      subject: `Neue Sponsoring-Anfrage: ${data.songDetails.name}`,
      html: `
        <h2>Neue Sponsoring-Anfrage</h2>
        <p><strong>Von:</strong> ${data.name} (${data.email})</p>
        <p><strong>Lied:</strong> ${data.songDetails.name} von ${data.songDetails.komponist}</p>
        <p><strong>Gesamtbetrag:</strong> ${data.songDetails.gesamtpreis.toFixed(2)} €</p>
        <p><strong>Nachricht:</strong> ${data.message}</p>
      `,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to process sponsorship request' },
      { status: 500 }
    );
  }
}