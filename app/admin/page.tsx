"use client";

import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function AdminDashboard() {
  const { data: session } = useSession();

  if (!session) redirect("/login");

  return (
    <div>
      <h1>Willkommen, {session.user?.name}</h1>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
