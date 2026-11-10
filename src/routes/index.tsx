import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import logo from "@/assets/madame-plaid-rose.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Madame Plaid — sua stylist pessoal" },
      { name: "description", content: "Looks atemporais montados com o seu próprio guarda-roupa para cada evento, horário e clima." },
      { property: "og:title", content: "Madame Plaid — sua stylist pessoal" },
      { property: "og:description", content: "Looks atemporais montados com o seu próprio guarda-roupa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="editorial-page flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <p className="mb-8 text-xs uppercase text-primary">O closet da Raianne</p>
      <img src={logo} alt="" width={816} height={816} className="editorial-emblem h-52 w-52 sm:h-64 sm:w-64" />
      <h1 className="editorial-title mt-7 text-5xl sm:text-7xl">Madame <span className="italic text-primary">Plaid</span></h1>
      <p className="mt-5 font-display text-2xl text-muted-foreground">Uma ocasião. A sua essência.</p>
      <Button asChild size="lg" className="mt-8 h-12 gap-8"><Link to="/chat">Começar <ArrowUpRight /></Link></Button>
    </div>
  );
}
