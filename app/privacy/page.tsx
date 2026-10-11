import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

// A public page. Google asks every app that uses Google sign-in to link to
// a privacy policy, even one that only its owner uses.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-xl p-6 leading-relaxed sm:py-16">
      <h1 className="text-base font-medium">Privacy</h1>

      <div className="mt-6 flex flex-col gap-4 text-muted">
        <p>
          Gylt is a personal dashboard built and used by one person. It is not a public service
          and has no user accounts.
        </p>
        <p>
          It reads its owner&apos;s own data to show it on a single private page: upcoming
          assignments from Canvas, events from Google Calendar, the sender and subject of recent
          Gmail messages (never their contents), a weather forecast, a Duolingo streak, and
          to-dos stored in the owner&apos;s own database.
        </p>
        <p>
          Google data is used only to display it to the owner. It is not stored by the
          dashboard, not shared with anyone, not sold, and not used for advertising or to train
          AI models.
        </p>
        <p>
          The source code is public at{" "}
          <a href="https://github.com/ArturHI/Gylt" className="text-ink underline">
            github.com/ArturHI/Gylt
          </a>
          , where questions can be raised as an issue.
        </p>
      </div>
    </main>
  );
}
