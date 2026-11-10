import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/madame-plaid.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Madame Plaid — sua stylist pessoal" },
      { name: "description", content: "Looks atemporais montados com o seu próprio guarda-roupa para cada evento, horário e clima." },
      { property: "og:title", content: "Madame Plaid — sua stylist pessoal" },
      { property: "og:description", content: "Looks atemporais montados com o seu próprio guarda-roupa." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-plaid bg-background px-6 text-center">
      <img src={logo} alt="Madame Plaid" width={816} height={816} className="h-44 w-44 rounded-full shadow-xl" />
      <h1 className="mt-6 text-6xl">Madame Plaid</h1>
      <p className="mt-3 max-w-md text-lg text-muted-foreground">
        Diga aonde vai. Ela abre o seu guarda-roupa e devolve três looks — com o porquê de cada linha, camada e cor.
      </p>
      <Button asChild size="lg" className="mt-8"><Link to="/chat">Começar</Link></Button>
    </div>
  );
}
