"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Song {
  id: number;
  name: string;
  komponist: string;
  anzahl: number;
  preis: number;
  gesamtpreis: number;
  bewerber: number;
}

interface Sponsor {
  name: string;
  vorname: string;
  email: string;
  telefon: string;
  message: string;
  song: {
    name: string;
  }
}

interface CSVNoten {
  name: string;
  komponist: string;
  anzahl: number;
  preis: number;
  gesamtpreis: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notenData, setNotenData] = useState<Song[]>([]);
  const [sponsorenData, setSponsorenData] = useState<Sponsor[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<{vorname: string, name: string, message: string} | null>(null);
  const [selectedSponsorSong, setSelectedSponsorSong] = useState<Song | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if(status !== "authenticated") return;

    fetch("/api/admin/songs")
      .then((res) => res.json())
      .then((data) => setNotenData(data));

    fetch("/api/admin/sponsors")
      .then((res) => res.json())
      .then((data) => setSponsorenData(data));
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function handleDeleteSong(id: number) {
    const res = await fetch(`/api/admin/songs/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setNotenData(notenData.filter((song) => song.id !== id));
      setSelectedSong(null);
      toast.success("Song erfolgreich entfernt")
    } else {
      console.error("Fehler beim Löschen des Songs");
      toast.error("Fehler beim Entfernen des Songs")
    }
  }

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const findSongByName = (songName: string) => {
    return notenData.find(song => song.name === songName) || null;
  };

  const exportToCSV = () => {
    // CSV Header
    const headers = [
      "Vorname",
      "Nachname",
      "Email",
      "Telefon",
      "Nachricht",
      "Song Name",
      "Song Komponist",
      "Song Anzahl",
      "Song Preis pro Stück",
      "Song Gesamtpreis",
      "Song Bewerber"
    ];

    // CSV Data
    const csvData = sponsorenData.map(sponsor => {
      const song = findSongByName(sponsor.song.name);
      return [
        sponsor.vorname,
        sponsor.name,        
        sponsor.email,
        sponsor.telefon,
        sponsor.message,
        sponsor.song.name,
        song?.komponist || "",
        song?.anzahl || "",
        song?.preis ? `${song.preis.toFixed(2)} €` : "",
        song?.gesamtpreis ? `${song.gesamtpreis.toFixed(2)} €` : "",
        song?.bewerber || ""
      ];
    });

    // Combine headers and data
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sponsoren_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const text = await file.text();
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      
      // Skip header row and parse data
      const noten: CSVNoten[] = rows.slice(1).map(row => {
        const [name, komponist, anzahl, preis, gesamtpreis] = row
          .split(',')
          .map(cell => cell.replace(/"/g, '').trim());
        
        return {
          name,
          komponist,
          anzahl: parseInt(anzahl),
          preis: parseFloat(preis.replace('€', '').trim()),
          gesamtpreis: parseFloat(gesamtpreis.replace('€', '').trim())
        };
      });

      // Validate data
      const invalidRows = noten.filter(note => 
        !note.name || 
        !note.komponist || 
        isNaN(note.anzahl) || 
        isNaN(note.preis) || 
        isNaN(note.gesamtpreis)
      );

      if (invalidRows.length > 0) {
        throw new Error('Ungültige Daten in der CSV-Datei gefunden');
      }

      // Send data to API
      const response = await fetch('/api/admin/songs/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noten),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Hochladen der Noten');
      }

      // Refresh data and show success message
      fetch("/api/admin/songs")
        .then((res) => res.json())
        .then((data) => setNotenData(data));

      toast.success("Noten erfolgreich hochgeladen", {
        description: `${noten.length} Noten wurden hinzugefügt.`,
        duration: 5000,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Fehler beim Hochladen", {
        description: "Die CSV-Datei konnte nicht verarbeitet werden. Bitte überprüfen Sie das Format.",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Willkommen, {session?.user?.name}</h1>
        <Button onClick={() => signOut()}>Logout</Button>
      </div>
      <Tabs defaultValue="noten" className="w-full">
        <TabsList>
          <TabsTrigger value="noten">Noten</TabsTrigger>
          <TabsTrigger value="sponsoren">Sponsoren</TabsTrigger>
        </TabsList>
        <TabsContent value="noten">
          <div className="flex justify-end mb-4">
            <div className="relative">
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
                disabled={isUploading}
              />
              <Button
                onClick={() => document.getElementById('csv-upload')?.click()}
                className="flex items-center gap-2"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Wird hochgeladen..." : "CSV hochladen"}
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Komponist</TableHead>
                <TableHead>Anzahl</TableHead>
                <TableHead>Preis (€)</TableHead>
                <TableHead>Gesamtpreis (€)</TableHead>
                <TableHead>Bewerber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notenData.map((item, index) => (
                <TableRow 
                  key={index} 
                  onClick={() => setSelectedSong(item)} 
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.komponist}</TableCell>
                  <TableCell>{item.anzahl}</TableCell>
                  <TableCell>{item.preis}</TableCell>
                  <TableCell>{item.gesamtpreis}</TableCell>
                  <TableCell>{item.bewerber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {selectedSong && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Song Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Name:</strong> {selectedSong.name}</p>
                <p><strong>Komponist:</strong> {selectedSong.komponist}</p>
                <p><strong>Anzahl:</strong> {selectedSong.anzahl}</p>
                <p><strong>Preis:</strong> {selectedSong.preis} €</p>
                <p><strong>Gesamtpreis:</strong> {selectedSong.gesamtpreis} €</p>
                <p><strong>Bewerber:</strong> {selectedSong.bewerber}</p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="destructive" onClick={() => handleDeleteSong(selectedSong.id)}>
                  Löschen
                </Button>
                <Button onClick={() => setSelectedSong(null)}>Schließen</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="sponsoren">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Als CSV exportieren
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vorname</TableHead>
                <TableHead>Nachname</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Song</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorenData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.vorname}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.telefon}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <span className="text-sm">{truncateMessage(item.message)}</span>
                      {item.message.length > 50 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-xs"
                          onClick={() => setSelectedMessage({vorname: item.vorname, name: item.name, message: item.message})}
                        >
                          Mehr
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      onClick={() => setSelectedSponsorSong(findSongByName(item.song.name))}
                    >
                      {item.song.name}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Nachricht von {selectedMessage?.vorname} {selectedMessage?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="whitespace-pre-wrap break-words p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
              {selectedMessage?.message}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Schließen</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Song Details Dialog */}
      <Dialog open={!!selectedSponsorSong} onOpenChange={() => setSelectedSponsorSong(null)}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>Song Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{selectedSponsorSong?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Komponist</p>
                <p className="font-medium">{selectedSponsorSong?.komponist}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Anzahl</p>
                <p className="font-medium">{selectedSponsorSong?.anzahl}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Preis pro Stück</p>
                <p className="font-medium">{selectedSponsorSong?.preis.toFixed(2)} €</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gesamtpreis</p>
                <p className="font-medium">{selectedSponsorSong?.gesamtpreis.toFixed(2)} €</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Bewerber</p>
                <p className="font-medium">{selectedSponsorSong?.bewerber}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Schließen</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}