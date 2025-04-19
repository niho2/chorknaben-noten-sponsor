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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Song {
  id: number;
  name: string;
  komponist: string;
  anzahl: number;
  preis: number;
  gesamtpreis: number;
  bewerber: number;
  besetzung: string;
}

interface Sponsor {
  id: number;
  name: string;
  vorname: string;
  email: string;
  telefon: string;
  message: string;
  song: {
    id: number;
    name: string;
  };
  songId: number;
}

interface CSVNoten {
  name: string;
  komponist: string;
  anzahl: number;
  preis: number;
  gesamtpreis: number;
  besetzung: string;
}

// Typ für Formulardaten (ohne ID, da diese erst bei Erstellung vergeben wird)
type SongFormData = Omit<Song, 'id' | 'bewerber'>;

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notenData, setNotenData] = useState<Song[]>([]);
  const [sponsorenData, setSponsorenData] = useState<Sponsor[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<{vorname: string, name: string, message: string} | null>(null);
  const [selectedSponsorSong, setSelectedSponsorSong] = useState<Song | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State für Sponsor Löschen Dialog
  const [selectedSponsorForDeletion, setSelectedSponsorForDeletion] = useState<Sponsor | null>(null);

  // State für Song Erstellen/Bearbeiten Dialog
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songFormData, setSongFormData] = useState<SongFormData>({
    name: "",
    komponist: "",
    anzahl: 0,
    preis: 0,
    gesamtpreis: 0,
    besetzung: "SATB", // Standardwert oder erster Wert der Auswahl
  });
  const [isSubmittingSong, setIsSubmittingSong] = useState(false); // Für Ladezustand im Dialog

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
      "Song Bewerber",
      "Song Besetzung"
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
        song?.bewerber || "",
        song?.besetzung || ""
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
        const [name, komponist, anzahl, preis, gesamtpreis, besetzung] = row
          .split(',')
          .map(cell => cell.replace(/"/g, '').trim());
        
        return {
          name,
          komponist,
          anzahl: parseInt(anzahl),
          preis: parseFloat(preis.replace('€', '').trim()),
          gesamtpreis: parseFloat(gesamtpreis.replace('€', '').trim()),
          besetzung
        };
      });

      // Validate data
      const invalidRows = noten.filter(note => 
        !note.name || 
        !note.komponist || 
        !note.besetzung ||
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

  // Funktion zum Öffnen des Song-Dialogs (Erstellen/Bearbeiten)
  const handleOpenSongDialog = (song: Song | null = null) => {
    setEditingSong(song);
    if (song) {
      // Bestehenden Song bearbeiten
      setSongFormData({
        name: song.name,
        komponist: song.komponist,
        anzahl: song.anzahl,
        preis: song.preis,
        gesamtpreis: song.gesamtpreis,
        besetzung: song.besetzung,
      });
    } else {
      // Neuen Song erstellen (Standardwerte)
      setSongFormData({
        name: "",
        komponist: "",
        anzahl: 0,
        preis: 0,
        gesamtpreis: 0,
        besetzung: "SATB",
      });
    }
    setIsSongDialogOpen(true);
  };

  // Funktion zum Behandeln von Änderungen im Song-Formular
  const handleSongFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setSongFormData((prev) => ({
      ...prev,
      [id]: type === 'number' ? parseFloat(value) || 0 : value,
    }));

    // Automatische Berechnung des Gesamtpreises
    if (id === 'anzahl' || id === 'preis') {
      const anzahl = id === 'anzahl' ? parseFloat(value) || 0 : songFormData.anzahl;
      const preis = id === 'preis' ? parseFloat(value) || 0 : songFormData.preis;
      setSongFormData((prev) => ({
        ...prev,
        gesamtpreis: anzahl * preis,
      }));
    }
  };

  // Funktion zum Absenden des Song-Formulars (Erstellen/Aktualisieren)
  const handleSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSong(true);

    const url = editingSong ? `/api/admin/songs/${editingSong.id}` : '/api/admin/songs';
    const method = editingSong ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Fehler beim ${editingSong ? 'Aktualisieren' : 'Erstellen'} des Songs`);
      }

      const savedSong: Song = await response.json();

      // Notenliste im Frontend aktualisieren
      if (editingSong) {
        setNotenData(notenData.map(s => s.id === savedSong.id ? savedSong : s));
      } else {
        setNotenData([...notenData, savedSong]);
      }

      toast.success(`Song erfolgreich ${editingSong ? 'aktualisiert' : 'erstellt'}`);
      setIsSongDialogOpen(false);

    } catch (error: any) {
      console.error("Song submission error:", error);
      toast.error("Fehler", {
        description: error.message || `Der Song konnte nicht ${editingSong ? 'aktualisiert' : 'erstellt'} werden.`,
      });
    } finally {
      setIsSubmittingSong(false);
    }
  };

  // Funktion zum Löschen eines Sponsors
  const handleDeleteSponsor = async (sponsorId: number, songId: number) => {
    if (!selectedSponsorForDeletion) return;

    try {
      const response = await fetch(`/api/admin/sponsors/${sponsorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Löschen des Sponsors");
      }

      // Sponsorenliste im Frontend aktualisieren
      setSponsorenData(sponsorenData.filter(s => s.id !== sponsorId));

      // Notenliste im Frontend aktualisieren (Bewerberzahl dekrementieren)
      setNotenData(notenData.map(song => 
        song.id === songId && song.bewerber > 0
          ? { ...song, bewerber: song.bewerber - 1 } 
          : song
      ));

      toast.success("Sponsor erfolgreich gelöscht");
      setSelectedSponsorForDeletion(null); // Dialog schließen

    } catch (error: any) {
      console.error("Sponsor deletion error:", error);
      toast.error("Fehler", {
        description: error.message || "Der Sponsor konnte nicht gelöscht werden.",
      });
      setSelectedSponsorForDeletion(null); // Dialog auch bei Fehler schließen
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
          <div className="flex justify-between items-center mb-4">
            <Button onClick={() => handleOpenSongDialog()}>Neuen Song hinzufügen</Button>
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
                <TableHead>Besetzung</TableHead>
                <TableHead className="text-right">Anzahl</TableHead>
                <TableHead className="text-right">Preis (€)</TableHead>
                <TableHead className="text-right">Gesamt (€)</TableHead>
                <TableHead className="text-right">Sponsoren</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notenData.map((song) => (
                <TableRow key={song.id}>
                  <TableCell className="font-medium">{song.name}</TableCell>
                  <TableCell>{song.komponist}</TableCell>
                  <TableCell>{song.besetzung}</TableCell>
                  <TableCell className="text-right">{song.anzahl}</TableCell>
                  <TableCell className="text-right">{song.preis.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{song.gesamtpreis.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{song.bewerber}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenSongDialog(song)}>Bearbeiten</Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" onClick={() => setSelectedSong(song)}>Löschen</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {selectedSong && (
            <Dialog open={!!selectedSong} onOpenChange={() => setSelectedSong(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Song löschen bestätigen</DialogTitle>
                  <DialogDescription>
                    Sind Sie sicher, dass Sie den Song "{selectedSong.name}" von {selectedSong.komponist} löschen möchten?
                    Dieser Vorgang kann nicht rückgängig gemacht werden.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedSong(null)}>Abbrechen</Button>
                  <Button variant="destructive" onClick={() => handleDeleteSong(selectedSong.id)}>Löschen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorenData.map((item) => (
                <TableRow key={item.id}>
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
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => setSelectedSponsorForDeletion(item)}
                    >
                      Löschen
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
                <p className="text-sm text-muted-foreground">Besetzung</p>
                <p className="font-medium">{selectedSponsorSong?.besetzung}</p>
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

      {/* Sponsor Löschen Bestätigungsdialog */} 
      <Dialog open={!!selectedSponsorForDeletion} onOpenChange={() => setSelectedSponsorForDeletion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sponsor löschen bestätigen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den Sponsor "{selectedSponsorForDeletion?.vorname} {selectedSponsorForDeletion?.name}" 
              für den Song "{selectedSponsorForDeletion?.song?.name}" löschen möchten?
              Dieser Vorgang kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSponsorForDeletion(null)}>Abbrechen</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedSponsorForDeletion && handleDeleteSponsor(selectedSponsorForDeletion.id, selectedSponsorForDeletion.songId)}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Song Erstellen/Bearbeiten Dialog */}
      <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSong ? 'Song bearbeiten' : 'Neuen Song hinzufügen'}</DialogTitle>
            <DialogDescription>
              {editingSong ? 'Aktualisieren Sie die Details des Songs.' : 'Füllen Sie die Details für den neuen Song aus.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSongSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={songFormData.name} onChange={handleSongFormChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="komponist" className="text-right">Komponist</Label>
              <Input id="komponist" value={songFormData.komponist} onChange={handleSongFormChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="besetzung" className="text-right">Besetzung</Label>
              {/* Hier könnte auch ein Select-Feld verwendet werden */}
              <Input id="besetzung" value={songFormData.besetzung} onChange={handleSongFormChange} placeholder="z.B. SATB, SA, TB" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="anzahl" className="text-right">Anzahl</Label>
              <Input id="anzahl" type="number" value={songFormData.anzahl} onChange={handleSongFormChange} className="col-span-3" required min="0" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preis" className="text-right">Preis (€)</Label>
              <Input id="preis" type="number" value={songFormData.preis} onChange={handleSongFormChange} className="col-span-3" required min="0" step="0.01" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gesamtpreis" className="text-right">Gesamt (€)</Label>
              {/* Gesamtpreis wird berechnet und ist nur lesend */}
              <Input id="gesamtpreis" type="number" value={songFormData.gesamtpreis.toFixed(2)} className="col-span-3" readOnly disabled />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSongDialogOpen(false)} disabled={isSubmittingSong}>Abbrechen</Button>
              <Button type="submit" disabled={isSubmittingSong}>
                {isSubmittingSong ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...</>
                ) : (
                  'Song speichern'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}