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
import logo from "@/assets/madame-plaid.png";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
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
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <img src={logo} alt="Madame Plaid" className="mb-4 h-24 w-24 rounded-full shadow-md" />
              <h1 className="text-4xl">Para onde vamos hoje?</h1>
              <p className="mt-2 max-w-md text-muted-foreground">Conte o evento, o horário e o clima. Eu monto três looks com as peças do seu guarda-roupa.</p>
              <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-sm border bg-card p-3 text-left text-sm hover:border-primary">
                    {s}
                  </button>
                ))}
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
        <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
          <PromptInputTextarea name="message" placeholder="Ex.: palestra amanhã às 9h, vai chover…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
