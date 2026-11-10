import { queryOptions } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

export const threadsQuery = queryOptions({
  queryKey: ["threads"],
  queryFn: async () => {
    const { data, error } = await supabase.from("threads").select("id,title,updated_at").order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const messagesQuery = (threadId: string) =>
  queryOptions({
    queryKey: ["messages", threadId],
    queryFn: async (): Promise<UIMessage[]> => {
      const { data, error } = await supabase.from("messages").select("ui_id,role,parts").eq("thread_id", threadId).order("created_at");
      if (error) throw error;
      return data.map((r) => ({ id: r.ui_id, role: r.role as UIMessage["role"], parts: r.parts as UIMessage["parts"] }));
    },
    staleTime: Infinity,
  });

export async function createThread() {
  const { data, error } = await supabase.from("threads").insert({}).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("threads").delete().eq("id", id);
  if (error) throw error;
}
