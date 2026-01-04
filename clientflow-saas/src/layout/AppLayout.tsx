import type { ReactNode } from "react";
import TopNav from "../components/navigation/TopNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
