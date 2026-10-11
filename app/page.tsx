import { DashboardGrid } from "@/components/DashboardGrid";

export default function Home() {
  // No maximum width: the grid runs to the edges of the window.
  return (
    <main className="w-full p-4 sm:p-6">
      <DashboardGrid />
    </main>
  );
}
