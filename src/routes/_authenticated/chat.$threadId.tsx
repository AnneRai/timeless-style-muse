import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { messagesQuery } from "@/lib/threads";
import { Conversation, ConversationContent, ConversationScrollButton, ConversationEmptyState } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Music2, BriefcaseBusiness, Flower2, Drama } from "lucide-react";
import logo from "@/assets/madame-plaid-rose.jpg";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({ meta: [
    { title: "Seu evento — Madame Plaid" },
    { name: "description", content: "Converse com Madame Plaid e escolha seus looks para o próximo evento." },
    { property: "og:title", content: "Seu evento — Madame Plaid" },
    { property: "og:description", content: "Seu guarda-roupa, suas referências, sua próxima ocasião." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(messagesQuery(params.threadId)),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { data } = useSuspenseQuery(messagesQuery(threadId));
  return <ChatWindow key={threadId} threadId={threadId} initial={data} />;
}

const SUGGESTIONS = [
  "Show de cover de rock num bar, sexta à noite, uns 22°C",
  "Feira de emprego de manhã, calor de 30°C",
  "Piquenique no parque domingo à tarde, nublado",
  "Teatro à noite, friozinho de 16°C",
];
const EVENT_ICONS = [Music2, BriefcaseBusiness, Flower2, Drama];
const EVENT_LABELS = ["Uma noite de rock", "Um novo capítulo", "Domingo no parque", "Uma noite no teatro"];

function ChatWindow({ threadId, initial }: { threadId: string; initial: UIMessage[] }) {
  const qc = useQueryClient();
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
      }),
    [threadId],
  );
  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "Algo deu errado."),
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["messages", threadId] });
    },
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) document.querySelector<HTMLTextAreaElement>("textarea[name=message]")?.focus();
  }, [busy, threadId]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
  };
  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && !last.parts.some((p) => p.type === "text" && p.text));

  return (
    <div className="editorial-page flex min-h-0 flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ConversationEmptyState className="py-10 sm:py-16">
              <img src={logo} alt="" className="editorial-emblem mb-5 h-32 w-32 sm:h-40 sm:w-40" />
              <p className="mb-3 text-xs uppercase text-primary">Madame Plaid · styling pessoal</p>
              <h1 className="editorial-title text-4xl sm:text-5xl">Para onde vamos hoje?</h1>
              <div className="mt-8 grid w-full max-w-xl gap-x-8 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = EVENT_ICONS[i] ?? Music2;
                  return <Button key={s} variant="outline" onClick={() => send(s)} className="event-choice gap-3 bg-transparent px-0 hover:bg-secondary/40">
                    <Icon className="text-primary" />
                    <span className="flex-1"><span className="block font-display text-xl">{EVENT_LABELS[i]}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{["Sexta · 22°C", "Feira de emprego · 30°C", "Piquenique · nublado", "Teatro · 16°C"][i]}</span></span>
                    <ArrowUpRight className="text-muted-foreground" />
                  </Button>;
                })}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "stylist-answer"}>
                  {m.parts.map((p, i) =>
                    p.type === "text" ? (m.role === "user" ? <p key={i}>{p.text}</p> : <MessageResponse key={i}>{p.text}</MessageResponse>) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {waiting && <Shimmer>Abrindo o guarda-roupa…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto w-full max-w-3xl p-4">
        <PromptInput className="editorial-composer" onSubmit={(msg) => send(msg.text ?? "")}>
          <PromptInputTextarea name="message" placeholder="Ex.: palestra amanhã às 9h, vai chover…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
