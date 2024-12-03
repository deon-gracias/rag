import { z } from "zod";

export const BACKEND_ENDPOINT = "http://localhost:8000";

export const ChatSession = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});

export type ChatSessionType = z.infer<typeof ChatSession>;

const ChatSessionResponse = z.object({
  ok: z.boolean(),
  data: ChatSession.optional(),
});

export type DeleteChatSession = z.infer<typeof ChatSessionResponse>;

export const ChatSessionMessages = z.object({
  id: z.number(),
  type: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
});

export type ChatSessionMessagesType = z.infer<typeof ChatSessionMessages>;

export const ChatResponse = z.object({
  content: z.string(),
  type: z.string(),
  usage_metadata: z
    .object({
      input_tokens: z.number(),
      output_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
  response_metadata: z
    .object({
      model: z.string(),
      created_at: z.coerce.date(),
      message: z.object({
        role: z.string(),
      }),
      total_duration: z.number(),
      load_duration: z.number(),
    })
    .optional(),
});

export type ChatResponseType = z.infer<typeof ChatResponse>;

export async function new_chat_session() {
  const res = await fetch(`${BACKEND_ENDPOINT}/session/new`, {
    method: "POST",
  });
  const data = await res.json();

  console.log(data);

  return ChatSession.parse(data);
}

export async function delete_chat_session(id: number) {
  const res = await fetch(`${BACKEND_ENDPOINT}/session/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();

  console.log(data);

  return ChatSessionResponse.parse(data);
}

export async function chat(session_name: string, message: string) {
  const res = await fetch(`${BACKEND_ENDPOINT}/session/${session_name}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: message,
    }),
  });
  const data = await res.json();

  console.log(data);

  return ChatResponse.parse(data);
}

export async function upload_files(form: FormData) {
  const response = await fetch(
    `${BACKEND_ENDPOINT}/session/create_and_upload`,
    {
      method: "POST",
      body: form,
    },
  );
  const response_data = ChatSessionResponse.safeParse(await response.json());

  if (!response_data.success) {
    return ChatSession.parse({ ok: false });
  }

  if (!response_data.data.data) return undefined;
  return response_data.data.data;
}

export async function get_sessions() {
  const response = await fetch(`${BACKEND_ENDPOINT}/session`);
  const data = await response.json();

  console.log(data);

  return data;
}

export async function get_session(session_name: string) {
  const response = await fetch(`${BACKEND_ENDPOINT}/session/${session_name}`);
  const data = ChatSession.safeParse(await response.json());

  if (!data.success) return undefined;

  return data.data;
}

export async function get_session_messages(session_name: string) {
  const response = await fetch(
    `${BACKEND_ENDPOINT}/session/${session_name}/chat`,
  );
  const data = z.array(ChatSessionMessages).safeParse(await response.json());

  if (!data.success) return undefined;

  return data.data;
}
