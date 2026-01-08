import type { ReactNode } from "react";
import TopNav from "../components/navigation/TopNav";

export default function AppLayout({
  children,
  canAccessPaid,
  onSubscribe,
}: {
  children: ReactNode;
  canAccessPaid: boolean;
  onSubscribe: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav canAccessPaid={canAccessPaid} onSubscribe={onSubscribe} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
