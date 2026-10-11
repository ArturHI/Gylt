import { CalendarCard } from "@/components/CalendarCard";
import { Card, CardMessage } from "@/components/Card";
import { DeadlinesCard } from "@/components/DeadlinesCard";
import { EmailCard } from "@/components/EmailCard";
import { TodosCard } from "@/components/TodosCard";
import { WeatherCard } from "@/components/WeatherCard";

// Sections that are not built yet. Each becomes its own component, like
// DeadlinesCard, when its phase comes around.
const PLACEHOLDERS = [
  { title: "Spanish", note: "A little daily practice, later." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-base font-medium">Dashboard</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DeadlinesCard />
        <CalendarCard />
        <WeatherCard />
        <TodosCard />
        <EmailCard />
        {PLACEHOLDERS.map(({ title, note }) => (
          <Card key={title} title={title}>
            <CardMessage>{note}</CardMessage>
          </Card>
        ))}
      </div>
    </main>
  );
}
