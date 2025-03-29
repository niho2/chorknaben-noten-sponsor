"use client";

import React, { useState } from "react";
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
import { Search, Music } from "lucide-react";
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

// Define the Song type
interface Song {
  name: string;
  komponist: string;
  anzahl: number;
  preis: number;
  gesamtpreis: number;
  bewerber: number;
}

// Sample data
const songs: Song[] = [
  {
    name: "Lied Eins",
    komponist: "Komponist A",
    anzahl: 3,
    preis: 10,
    gesamtpreis: 30,
    bewerber: 1,
  },
  {
    name: "Lied Zwei",
    komponist: "Komponist B",
    anzahl: 2,
    preis: 15,
    gesamtpreis: 30,
    bewerber: 20,
  },
  {
    name: "Lied Drei",
    komponist: "Komponist C",
    anzahl: 1,
    preis: 20,
    gesamtpreis: 20,
    bewerber: 3,
  },
];

export default function Page() {
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

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
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", {
      song: selectedSong,
      sponsorInfo: formData,
    });
    setIsDialogOpen(false);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Lied oder Komponist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
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
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-slate-950">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Komponist</TableHead>
                  <TableHead className="text-right">Anzahl</TableHead>
                  <TableHead className="text-right">Preis (€)</TableHead>
                  <TableHead className="text-right">Gesamtpreis (€)</TableHead>
                  <TableHead className="text-right">Bewerber #</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSongs.length > 0 ? (
                  sortedSongs.map((song, index) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Keine Lieder gefunden. Bitte versuchen Sie einen anderen Suchbegriff.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sponsorship Dialog with Contact Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Lied sponsern
            </DialogTitle>
            <DialogDescription>
              {selectedSong && (
                <span>
                  Sie möchten das Lied <strong>{selectedSong.name}</strong> von {selectedSong.komponist} sponsern.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                placeholder="Max Mustermann" 
                required 
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="max@beispiel.de" 
                required 
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Nachricht</Label>
              <Textarea 
                id="message" 
                placeholder="Ihre Nachricht hier..." 
                required 
                value={formData.message}
                onChange={handleFormChange}
              />
            </div>
            
            {selectedSong && (
              <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm">
                <div className="font-medium">Sponsoring-Details:</div>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
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
            
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline">Abbrechen</Button>
              </DialogClose>
              <Button type="submit">Sponsoring absenden</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}