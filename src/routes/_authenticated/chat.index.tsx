import { createFileRoute, redirect } from "@tanstack/react-router";
import { createThread, threadsQuery } from "@/lib/threads";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [
    { title: "Seu closet — Madame Plaid" },
    { name: "description", content: "Escolha uma ocasião e encontre seus looks com Madame Plaid." },
    { property: "og:title", content: "Seu closet — Madame Plaid" },
    { property: "og:description", content: "Suas conversas de styling pessoal." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: async ({ context }) => {
    const threads = await context.queryClient.ensureQueryData(threadsQuery);
    const id = threads[0]?.id ?? (await createThread());
    if (!threads[0]) await context.queryClient.invalidateQueries({ queryKey: ["threads"] });
    throw redirect({ to: "/chat/$threadId", params: { threadId: id } });
  },
});
