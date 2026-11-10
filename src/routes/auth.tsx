import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/madame-plaid.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Madame Plaid" },
      { name: "description", content: "Entre para conversar com sua stylist pessoal." },
      { property: "og:title", content: "Entrar — Madame Plaid" },
      { property: "og:description", content: "Entre para conversar com sua stylist pessoal." },
    ],
  }),
  component: AuthPage,
});

const G = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/chat" }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/chat" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/chat" } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up") toast.success("Confira seu e-mail para confirmar a conta.");
  };
  const oauth = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-plaid bg-background p-4">
      <div className="w-full max-w-sm rounded-sm border bg-card p-8 shadow-xl">
        <img src={logo} alt="" className="mx-auto h-20 w-20 rounded-full" />
        <h1 className="mt-3 text-center text-3xl">Madame Plaid</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">{mode === "in" ? "Bem-vinda de volta" : "Crie sua conta"}</p>
        <form onSubmit={submit} className="space-y-3">
          <Input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" required minLength={6} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full" disabled={loading}>{mode === "in" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">ou</div>
        <div className="space-y-2">
          <button type="button" onClick={() => oauth("google")} className="google-btn flex h-10 w-full items-center justify-center gap-[10px] rounded-sm px-3 text-sm font-medium">
            <G /> Continue with Google
          </button>
          <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
        </div>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-5 w-full text-center text-sm text-primary underline-offset-4 hover:underline">
          {mode === "in" ? "Ainda não tem conta? Criar" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}
