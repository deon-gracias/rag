import { Chat } from "@/components/chat";
import { get_session, get_session_messages } from "@/lib/requests";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatSession({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const name = (await params).name;
  const chat_session = await get_session(name);

  if (!chat_session) notFound();

  console.log(chat_session.name);
  const chat_session_messages = await get_session_messages(chat_session.name);
  //
  if (!chat_session_messages) return notFound();

  // console.log(chat_session_messages);

  return (
    <Chat session={chat_session} initial_messages={chat_session_messages} />
  );
}
