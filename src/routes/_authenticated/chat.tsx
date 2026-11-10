import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createThread, deleteThread, threadsQuery } from "@/lib/threads";
import { Button } from "@/components/ui/button";
import logo from "@/assets/madame-plaid-rose.jpg";

export const Route = createFileRoute("/_authenticated/chat")({
  loader: ({ context }) => context.queryClient.ensureQueryData(threadsQuery),
  component: ChatLayout,
});

function ChatLayout() {
  const { data: threads } = useSuspenseQuery(threadsQuery);
  const params = useParams({ strict: false }) as { threadId?: string };
  const navigate = useNavigate();
  const qc = useQueryClient();

  const onNew = async () => {
    try {
      const id = await createThread();
      await qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    } catch { toast.error("Não consegui criar a conversa."); }
  };
  const onDelete = async (id: string) => {
    try {
      await deleteThread(id);
      await qc.invalidateQueries({ queryKey: ["threads"] });
      if (params.threadId === id) navigate({ to: "/chat" });
    } catch { toast.error("Não consegui apagar."); }
  };
  const onSignOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-6 py-8">
          <img src={logo} alt="" className="mb-5 h-20 w-20 rounded-full" />
          <p className="font-display text-4xl leading-none">Madame<br /><span className="italic text-sidebar-primary">Plaid</span></p>
          <p className="mt-4 text-xs uppercase text-sidebar-foreground/60">O closet da Raianne</p>
        </div>
        <div className="p-5">
          <Button onClick={onNew} className="h-11 w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
            <Plus /> Novo evento
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {threads.map((t) => (
            <div key={t.id} className={`group flex items-center rounded-sm ${params.threadId === t.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"}`}>
              <Link to="/chat/$threadId" params={{ threadId: t.id }} className="flex-1 truncate px-3 py-2 text-sm">{t.title}</Link>
              <Button variant="ghost" size="icon-sm" aria-label="Apagar conversa" onClick={() => onDelete(t.id)} className="shrink-0 opacity-0 group-hover:opacity-70 focus-visible:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-foreground">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </nav>
        <Button variant="ghost" onClick={onSignOut} className="h-14 justify-start rounded-none border-t border-sidebar-border p-5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b p-3 md:hidden">
          <span className="font-display text-lg">Madame Plaid</span>
          <Button size="sm" onClick={onNew}><Plus /> Novo</Button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
