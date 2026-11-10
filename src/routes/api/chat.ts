import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import { buildStylistInstructions } from "@/lib/stylist.server";
import { createResponsesCall } from "@/lib/ai-gateway.server";
import { withLovableAiGatewayRunIdHeader } from "@/lib/run-id.server";

function userClient(token: string) {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
        if (!token) return new Response("Faça login para continuar.", { status: 401 });
        const supabase = userClient(token);
        const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (authErr || !userId) return new Response("Sessão inválida.", { status: 401 });

        const { messages, threadId } = (await request.json()) as { messages: UIMessage[]; threadId: string };
        const { data: thread } = await supabase.from("threads").select("id,title").eq("id", threadId).maybeSingle();
        if (!thread) return new Response("Conversa não encontrada.", { status: 404 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("IA não configurada.", { status: 500 });

        const { result, runIdFetch } = createResponsesCall(
          request, apiKey, "openai/gpt-6-astra",
          await convertToModelMessages(messages), buildStylistInstructions(),
        );

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages,
          sendReasoning: true,
          onError: (e) => {
            const s = (e as { statusCode?: number })?.statusCode;
            if (s === 429) return "Muitas pedidas ao mesmo tempo — tente de novo em instantes.";
            if (s === 402) return "Os créditos de IA acabaram. Adicione créditos no workspace para continuar.";
            return "Não consegui montar os looks agora. Tente novamente.";
          },
          onFinish: async ({ messages: all }) => {
            const rows = all.map((m) => ({
              thread_id: threadId, user_id: userId, ui_id: m.id, role: m.role,
              parts: m.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
            }));
            const { error } = await supabase.from("messages").upsert(rows, { onConflict: "thread_id,ui_id" });
            if (error) console.error("Falha ao salvar mensagens", error);
            const firstUser = all.find((m) => m.role === "user");
            const patch: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
            if (thread.title === "Novo look" && firstUser) {
              const t = firstUser.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
              patch.title = t.slice(0, 48) || "Novo look";
            }
            const { error: tErr } = await supabase.from("threads").update(patch).eq("id", threadId);
            if (tErr) console.error("Falha ao atualizar conversa", tErr);
          },
        });
        return withLovableAiGatewayRunIdHeader(response, runIdFetch);
      },
    },
  },
});
