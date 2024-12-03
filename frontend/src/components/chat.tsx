"use client";

import {
  BotMessageSquareIcon,
  InfoIcon,
  Loader2Icon,
  SendHorizonalIcon,
} from "lucide-react";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  chat,
  ChatResponseType,
  ChatSessionMessagesType,
  ChatSessionType,
} from "@/lib/requests";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { AutosizeTextarea } from "@/components/autosize-textarea";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session";

const messageSchema = z.object({
  message: z.string().min(2),
});

export function Chat({
  session,
  initial_messages = [],
}: {
  session: ChatSessionType;
  initial_messages?: (ChatSessionMessagesType | ChatResponseType)[];
}) {
  const sessionStore = useSessionStore();
  const router = useRouter();

  const [messages, setMessages] =
    React.useState<(ChatSessionMessagesType | ChatResponseType)[]>(
      initial_messages,
    );

  // formState in react-hook-form is acting weird so I created my own for now
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  });

  useEffect(() => {
    console.log(messages);
  }, []);

  useEffect(() => {
    container.current?.lastElementChild?.scrollIntoView();
    console.log(messages);
  }, [messages]);

  async function onSubmit(values: z.infer<typeof messageSchema>) {
    form.reset();
    setIsSubmitting(true);

    setMessages((messages) => [
      ...messages,
      { type: "human", content: values.message },
    ]);

    const response = await chat(session.name, values.message);
    console.log("Got chat response");

    setIsSubmitting(false);
    setMessages((messages) => [...messages, response]);
  }

  React.useEffect(() => {
    router.refresh();
  }, [sessionStore.all]);

  const container = React.useRef<HTMLDivElement>(null);

  return (
    <>
      <ScrollArea className="grow px-2 w-full">
        <div className="max-w-4xl mx-auto w-full" ref={container}>
          {messages.length < 1 ? (
            <div className="mt-12 px-2">
              <h4 className="text-xl font-muted">Hello Deon,</h4>
              <h2 className="text-4xl font-semibold tracking-tight">
                How can I help?
              </h2>
            </div>
          ) : (
            <div className="grid gap-8 py-4 w-full">
              {messages.map((chat, i) => (
                <div
                  ref={i === messages.length - 1 ? container : undefined}
                  key={i}
                  className={cn(
                    "px-4 py-2 rounded-xl grid gap-4",
                    chat.type === "human" &&
                    "max-w-[90%] place-self-end bg-secondary grid-cols-1",
                    chat.type === "ai" && "grid-cols-[auto,1fr]",
                  )}
                >
                  {chat.type === "ai" && (
                    <div>
                      <BotMessageSquareIcon className="size-4 mt-1" />
                    </div>
                  )}
                  <div className="prose prose-stone prose-sm md:prose-base lg:prose-lg dark:prose-invert min-w-none w-full">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {chat.content}
                    </Markdown>
                  </div>
                  {"response_metadata" in chat && "usage_metadata" in chat && (
                    <ViewDetails chat={chat} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      {isSubmitting && (
        <div className="border-t p-4 flex items-center gap-2 justify-center">
          <Loader2Icon className="animate-spin size-4" />
          Generating
        </div>
      )}
      <div className="border-t">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-4xl mx-auto px-2 pt-4 pb-4 flex gap-2"
          >
            {/* <UploadFiles type="icon" /> */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="w-full flex items-center">
                  <FormControl>
                    <AutosizeTextarea
                      className="h-full"
                      minHeight={0}
                      maxHeight={200}
                      autoComplete="off"
                      placeholder="Type here to chat"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" size="icon" disabled={isSubmitting}>
              <SendHorizonalIcon />
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}

function ViewDetails({ chat }: { chat: ChatResponseType }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full" variant="ghost" size="icon">
          <InfoIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Details</DialogTitle>
        </DialogHeader>
        <Table className="text-sm">
          <TableBody>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableCell>{chat.response_metadata!.model}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Created At</TableHead>
              <TableCell>
                {chat.response_metadata!.created_at.toLocaleString()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Load Duration</TableHead>
              <TableCell>{chat.response_metadata!.load_duration}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Total Duration</TableHead>
              <TableCell>{chat.response_metadata!.total_duration}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Input Tokens</TableHead>
              <TableCell>{chat.usage_metadata!.input_tokens}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Output Tokens</TableHead>
              <TableCell>{chat.usage_metadata!.output_tokens}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Total Tokens</TableHead>
              <TableCell>{chat.usage_metadata!.total_tokens}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
