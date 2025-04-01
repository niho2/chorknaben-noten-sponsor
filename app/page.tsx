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
import { Search, Music, Check } from "lucide-react";
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
  name: string;
  komponist: string;
  anzahl: number;
  preis: number;
  gesamtpreis: number;
  bewerber: number;
}

export default function Page() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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

  // Filter songs based on search term in name or composer
  const filteredSongs = songs.filter((song) => {
    const term = search.toLowerCase();
    return (
      song.name.toLowerCase().includes(term) ||
      song.komponist.toLowerCase().includes(term)
    );
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
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleSponsorClick = (song: Song) => {
    setSelectedSong(song);
    setIsDialogOpen(true);
    setShowSuccess(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSong) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the data to send to the API
      const sponsorshipData = {
        ...formData,
        songDetails: {
          name: selectedSong.name,
          komponist: selectedSong.komponist,
          anzahl: selectedSong.anzahl,
          preis: selectedSong.preis,
          gesamtpreis: selectedSong.gesamtpreis,
        }
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
        setIsDialogOpen(false);
        setFormData({ name: "", email: "", message: "" });
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
              <SelectTrigger className="w-full sm:w-40 text-sm sm:text-base">
                <SelectValue placeholder="Sortieren nach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nach Name</SelectItem>
                <SelectItem value="komponist">Nach Komponist</SelectItem>
                <SelectItem value="preis">Nach Preis</SelectItem>
                <SelectItem value="anzahl">Nach Anzahl</SelectItem>
                <SelectItem value="gesamtpreis">Nach Gesamtpreis</SelectItem>
                <SelectItem value="bewerber">Nach Bewerber</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            {sortedSongs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {sortedSongs.map((song, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-base">{song.name}</h3>
                            <p className="text-sm text-muted-foreground">{song.komponist}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleSponsorClick(song)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Sponsern
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">Anzahl:</div>
                          <div className="text-right">{song.anzahl}</div>
                          <div className="text-muted-foreground">Preis pro Stück:</div>
                          <div className="text-right">{song.preis.toFixed(2)} €</div>
                          <div className="text-muted-foreground">Gesamtpreis:</div>
                          <div className="text-right font-medium">{song.gesamtpreis.toFixed(2)} €</div>
                          <div className="text-muted-foreground">Bewerber:</div>
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
                        <TableHead className="text-right">Anzahl</TableHead>
                        <TableHead className="text-right">Preis (€)</TableHead>
                        <TableHead className="text-right">Gesamtpreis (€)</TableHead>
                        <TableHead className="text-right">Bewerber</TableHead>
                        <TableHead className="text-right">Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSongs.map((song, index) => (
                        <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell className="font-medium">{song.name}</TableCell>
                          <TableCell>{song.komponist}</TableCell>
                          <TableCell className="text-right">{song.anzahl}</TableCell>
                          <TableCell className="text-right">{song.preis.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{song.gesamtpreis.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{song.bewerber}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              onClick={() => handleSponsorClick(song)}
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

      {/* Sponsorship Dialog with Contact Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Music className="h-5 w-5" />
              Lied sponsern
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedSong && !showSuccess && (
                <span>
                  Sie möchten das Lied <strong>{selectedSong.name}</strong> von {selectedSong.komponist} sponsern.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {showSuccess ? (
            <div className="py-4 sm:py-6">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-sm sm:text-base">Sponsoring erfolgreich!</AlertTitle>
                <AlertDescription className="text-sm sm:text-base">
                  Vielen Dank für Ihr Sponsoring. Eine Bestätigungs-E-Mail wurde an {formData.email} gesendet.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Max Mustermann" 
                  required 
                  value={formData.name}
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
              
              {selectedSong && (
                <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-2 sm:p-3 text-xs sm:text-sm">
                  <div className="font-medium">Sponsoring-Details:</div>
                  <div className="mt-1 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 text-muted-foreground">
                    <div>Lied:</div>
                    <div className="text-foreground">{selectedSong.name}</div>
                    <div>Komponist:</div>
                    <div className="text-foreground">{selectedSong.komponist}</div>
                    <div>Preis pro Stück:</div>
                    <div className="text-foreground">{selectedSong.preis.toFixed(2)} €</div>
                    <div>Anzahl:</div>
                    <div className="text-foreground">{selectedSong.anzahl}</div>
                    <div>Gesamtpreis:</div>
                    <div className="text-foreground font-medium">{selectedSong.gesamtpreis.toFixed(2)} €</div>
                  </div>
                </div>
              )}
              
              <DialogFooter className="sm:justify-end flex-col sm:flex-row gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting} className="w-full sm:w-auto text-sm sm:text-base">Abbrechen</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto text-sm sm:text-base">
                  {isSubmitting ? "Wird gesendet..." : "Sponsoring absenden"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}