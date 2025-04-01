"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  email: string;
  message: string;
  song: {
    name: string;
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notenData, setNotenData] = useState<Song[]>([]);
  const [sponsorenData, setSponsorenData] = useState<Sponsor[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  useEffect(() => {
    fetch("/api/admin/songs")
      .then((res) => res.json())
      .then((data) => setNotenData(data));

    fetch("/api/admin/sponsors")
      .then((res) => res.json())
      .then((data) => setSponsorenData(data));
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status, router]);

  async function handleDeleteSong(id: number) {
    const res = await fetch(`/api/admin/songs/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setNotenData(notenData.filter((song) => song.id !== id));
      setSelectedSong(null);
    } else {
      console.error("Fehler beim Löschen des Songs");
    }
  }

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Song</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorenData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.message}</TableCell>
                  <TableCell>{item.song.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
