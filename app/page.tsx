"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Music, Check, Users, Package, CircleDollarSign, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { toast } from "sonner"


// Define the Song type
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

export default function Page() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = useState<boolean>(false);
  const [selectedSongForSponsor, setSelectedSongForSponsor] = useState<Song | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);
  const [selectedSongForInfo, setSelectedSongForInfo] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    vorname: "",
    name: "",
    email: "",
    telefon: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const fetchSongs = () => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => setSongs(data))
      .catch((error) => console.error("Fehler beim Laden der Songs:", error));
  };


  useEffect(() => {
    fetchSongs();
  }, []);

  // Filter songs based on search term
  const filteredSongs = songs.filter((song) => {
    const term = search.toLowerCase();
    const matchesSearch = (
      song.name.toLowerCase().includes(term) ||
      song.komponist.toLowerCase().includes(term)
    );

    return matchesSearch;
  });

  // Sort the filtered songs
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortBy) {
      case "preis":
        return a.preis - b.preis;
      case "anzahl":
        return a.anzahl - b.anzahl;
      case "gesamtpreis":
        return a.gesamtpreis - b.gesamtpreis;
      case "komponist":
        return a.komponist.localeCompare(b.komponist);
      case "bewerber":
        return a.bewerber - b.bewerber;
      case "besetzung":
        return a.besetzung.localeCompare(b.besetzung);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleSponsorClick = (song: Song) => {
    setSelectedSongForSponsor(song);
    setIsSponsorDialogOpen(true);
    setShowSuccess(false);
    setIsInfoDialogOpen(false);
  };

  const handleInfoClick = (song: Song) => {
    setSelectedSongForInfo(song);
    setIsInfoDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSongForSponsor) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the data to send to the API
      const sponsorshipData = {
        ...formData,
        songDetails: {
          name: selectedSongForSponsor.name,
          komponist: selectedSongForSponsor.komponist,
          anzahl: selectedSongForSponsor.anzahl,
          preis: selectedSongForSponsor.preis,
          gesamtpreis: selectedSongForSponsor.gesamtpreis,
          besetzung: selectedSongForSponsor.besetzung,
        },
        songId: selectedSongForSponsor.id
      };
      
      // Send the data to our API endpoint
      const response = await fetch('/api/sponsor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sponsorshipData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Senden der Anfrage');
      }
      
      // Show success message
      setShowSuccess(true);
      fetchSongs();
      // Reset form after a delay
      setTimeout(() => {
        setIsSponsorDialogOpen(false);
        setFormData({ vorname: "", name: "", email: "", telefon: "", message: "" });
        setShowSuccess(false);
        
        // Show toast notification
        toast.success("Sponsoring erfolgreich!",{
          description: `Eine Bestätigungs-E-Mail wurde an ${formData.email} gesendet.`,
          duration: 5000,
        });        
      }, 3000);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Fehler beim Sponsoring",{        
        description: "Es gab ein Problem bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es später erneut.",        
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-2 sm:p-6">
      <Card className="shadow-md">
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Lied oder Komponist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-full text-sm sm:text-base"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                <SelectValue placeholder="Sortieren nach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nach Name</SelectItem>
                <SelectItem value="komponist">Nach Komponist</SelectItem>
                <SelectItem value="preis">Nach Preis</SelectItem>
                <SelectItem value="anzahl">Nach Anzahl</SelectItem>
                <SelectItem value="gesamtpreis">Nach Gesamtpreis</SelectItem>
                <SelectItem value="bewerber">Nach Bewerber</SelectItem>
                <SelectItem value="besetzung">Nach Besetzung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            {sortedSongs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {sortedSongs.map((song, index) => (
                    <Card 
                      key={index} 
                      className="p-4 cursor-pointer hover:bg-accent transition-colors" 
                      onClick={() => handleInfoClick(song)}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-base">{song.name}</h3>
                            <p className="text-sm text-muted-foreground">{song.komponist}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); handleSponsorClick(song); }}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Sponsern
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="flex items-center text-muted-foreground"><Package className="mr-1 h-4 w-4"/>Anzahl:</div>
                          <div className="text-right">{song.anzahl}</div>
                          <div className="flex items-center text-muted-foreground"><Users className="mr-1 h-4 w-4"/>Besetzung:</div>
                          <div className="text-right">{song.besetzung}</div>
                          <div className="flex items-center text-muted-foreground"><CircleDollarSign className="mr-1 h-4 w-4"/>Preis/Stück:</div>
                          <div className="text-right">{song.preis.toFixed(2)} €</div>
                          <div className="flex items-center text-muted-foreground"><CircleDollarSign className="mr-1 h-4 w-4 font-bold"/>Gesamtpreis:</div>
                          <div className="text-right font-medium">{song.gesamtpreis.toFixed(2)} €</div>
                          <div className="flex items-center text-muted-foreground"><Users className="mr-1 h-4 w-4"/>Bewerber:</div>
                          <div className="text-right">{song.bewerber}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-slate-950">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Komponist</TableHead>
                        <TableHead><div className="flex items-center"><Users className="mr-1 h-4 w-4"/>Besetzung</div></TableHead>
                        <TableHead className="text-right"><div className="flex items-center justify-end"><Package className="mr-1 h-4 w-4"/>Anzahl</div></TableHead>
                        <TableHead className="text-right"><div className="flex items-center justify-end"><CircleDollarSign className="mr-1 h-4 w-4"/>Preis (€)</div></TableHead>
                        <TableHead className="text-right"><div className="flex items-center justify-end"><CircleDollarSign className="mr-1 h-4 w-4 font-bold"/>Gesamt (€)</div></TableHead>
                        <TableHead className="text-right"><div className="flex items-center justify-end"><Users className="mr-1 h-4 w-4"/>Bewerber</div></TableHead>
                        <TableHead className="text-right">Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSongs.map((song, index) => (
                        <TableRow 
                          key={index} 
                          className="cursor-pointer hover:bg-accent transition-colors" 
                          onClick={() => handleInfoClick(song)}
                        >
                          <TableCell className="font-medium flex items-center"><Music className="mr-2 h-4 w-4 text-muted-foreground"/>{song.name}</TableCell>
                          <TableCell>{song.komponist}</TableCell>
                          <TableCell><div className="flex items-center">{song.besetzung}</div></TableCell>
                          <TableCell className="text-right"><div className="flex items-center justify-end">{song.anzahl}</div></TableCell>
                          <TableCell className="text-right"><div className="flex items-center justify-end">{song.preis.toFixed(2)}</div></TableCell>
                          <TableCell className="text-right"><div className="flex items-center justify-end">{song.gesamtpreis.toFixed(2)}</div></TableCell>
                          <TableCell className="text-right"><div className="flex items-center justify-end">{song.bewerber}</div></TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              onClick={(e) => { e.stopPropagation(); handleSponsorClick(song); }}
                              className="bg-primary hover:bg-primary/90"
                            >
                              Sponsern
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm sm:text-base">
                Keine Lieder gefunden. Bitte versuchen Sie einen anderen Suchbegriff.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sponsor Dialog */}
      <Dialog open={isSponsorDialogOpen} onOpenChange={setIsSponsorDialogOpen}> 
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col"> 
          <DialogHeader>
            <DialogTitle>Song Sponsern: {selectedSongForSponsor?.name}</DialogTitle> 
            <DialogDescription>
              Füllen Sie das Formular aus, um das Sponsoring für "{selectedSongForSponsor?.name}" abzuschließen. 
              Gesamtkosten: {selectedSongForSponsor?.gesamtpreis.toFixed(2)} €
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow overflow-y-auto pr-6 -mr-6"> 
            {!showSuccess ? (
              <form onSubmit={handleSubmit} id="sponsor-form" className="space-y-3 sm:space-y-4 pt-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="vorname" className="text-sm sm:text-base">Vorname</Label>
                  <Input 
                    id="vorname" 
                    placeholder="Max" 
                    required 
                    value={formData.vorname}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Mustermann" 
                    required 
                    value={formData.name}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="telefon" className="text-sm sm:text-base">Telefon</Label>
                  <Input 
                    id="telefon" 
                    type="tel" 
                    placeholder="+49 123 456789" 
                    required 
                    value={formData.telefon}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">E-Mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="max@beispiel.de" 
                    required 
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="message" className="text-sm sm:text-base">Nachricht</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Ihre Nachricht hier..." 
                    required 
                    value={formData.message}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                    className="text-sm sm:text-base min-h-[100px] resize-none whitespace-pre-wrap break-words"
                  />
                </div>
                
                {selectedSongForSponsor && (
                  <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-2 sm:p-3 text-xs sm:text-sm">
                    <div className="font-medium">Sponsoring-Details:</div>
                    <div className="mt-1 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 text-muted-foreground">
                      <div>Lied:</div>
                      <div className="text-foreground">{selectedSongForSponsor.name}</div>
                      <div>Komponist:</div>
                      <div className="text-foreground">{selectedSongForSponsor.komponist}</div>
                      <div>Besetzung:</div>
                      <div className="text-foreground">{selectedSongForSponsor.besetzung}</div>
                      <div>Preis pro Stück:</div>
                      <div className="text-foreground">{selectedSongForSponsor.preis.toFixed(2)} €</div>
                      <div>Anzahl:</div>
                      <div className="text-foreground">{selectedSongForSponsor.anzahl}</div>
                      <div>Gesamtpreis:</div>
                      <div className="text-foreground font-medium">{selectedSongForSponsor.gesamtpreis.toFixed(2)} €</div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="py-4 sm:py-6 flex items-center justify-center h-full">
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-sm sm:text-base">Sponsoring erfolgreich!</AlertTitle>
                  <AlertDescription className="text-sm sm:text-base">
                    Vielen Dank für Ihr Sponsoring. Eine Bestätigungs-E-Mail wurde an {formData.email} gesendet.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </ScrollArea> 
          {!showSuccess && (
            <DialogFooter className="mt-auto pt-4 border-t border-border sm:justify-end flex-col sm:flex-row gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting} className="w-full sm:w-auto text-sm sm:text-base">Abbrechen</Button>
              </DialogClose>
              <Button type="submit" form="sponsor-form" disabled={isSubmitting} className="w-full sm:w-auto text-sm sm:text-base">
                {isSubmitting ? "Wird gesendet..." : "Sponsoring absenden"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Neu: Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" /> {selectedSongForInfo?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedSongForInfo?.komponist}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label className="text-right text-muted-foreground flex items-center justify-end"><Users className="ml-1 h-4 w-4"/>Besetzung</Label>
              <span>{selectedSongForInfo?.besetzung}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label className="text-right text-muted-foreground flex items-center justify-end"><Package className="ml-1 h-4 w-4"/>Anzahl Noten</Label>
              <span>{selectedSongForInfo?.anzahl}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label className="text-right text-muted-foreground flex items-center justify-end"><CircleDollarSign className="ml-1 h-4 w-4"/>Preis pro Note</Label>
              <span>{selectedSongForInfo?.preis.toFixed(2)} €</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label className="text-right text-muted-foreground flex items-center justify-end"><CircleDollarSign className="ml-1 h-4 w-4 font-bold"/>Gesamtpreis</Label>
              <span>{selectedSongForInfo?.gesamtpreis.toFixed(2)} €</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label className="text-right text-muted-foreground flex items-center justify-end"><Users className="ml-1 h-4 w-4"/>Anzahl Sponsoren</Label>
              <span>{selectedSongForInfo?.bewerber}</span>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button 
              type="button" 
              onClick={() => selectedSongForInfo && handleSponsorClick(selectedSongForInfo)}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              Diesen Song Sponsern ({selectedSongForInfo?.gesamtpreis.toFixed(2)} €)
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full sm:w-auto mt-2 sm:mt-0">
                Schließen
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}