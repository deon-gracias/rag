import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BotMessageSquareIcon, SendHorizonalIcon } from "lucide-react";
import Image from "next/image";

import UploadImage from "@/assets/images/upload_file.png";
import React from "react";
import { UploadFiles } from "./_components/UploadFiles";

import { faker } from "@faker-js/faker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <>
      <ScrollArea className="grow py-4 px-2 max-h-full">
        <div className="max-w-4xl mx-auto grid">
          {false && <NoFileUploaded />}
          {true && (
            <div className="grid gap-8">
              {faker.helpers
                .multiple(
                  () => ({
                    user: faker.helpers.arrayElement(["system", "user"]),
                    text: faker.lorem.text(),
                  }),
                  {
                    count: 20,
                  },
                )
                .map((chat, i) => (
                  <div
                    key={i}
                    className={cn(
                      "capitalize px-4 py-2 rounded-xl grid gap-4",
                      chat.user === "user" &&
                        "max-w-[90%] place-self-end bg-secondary grid-cols-1",
                      chat.user === "system" && "grid-cols-[auto_1fr]",
                    )}
                  >
                    {chat.user === "system" && (
                      <BotMessageSquareIcon className="size-4 mt-1" />
                    )}
                    <div>{chat.text}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t">
        <form className="max-w-4xl mx-auto px-2 pt-4 pb-4 flex gap-2 justify-stretch">
          <UploadFiles type="icon" />

          <Input placeholder="Type here to chat" />

          <Button type="submit" size="icon">
            <SendHorizonalIcon />
          </Button>
        </form>
      </div>
    </>
  );
}

function NoFileUploaded() {
  return (
    <div className="w-full h-full flex justify-center items-center flex-col">
      <Image
        className="max-h-[400px] h-full w-auto"
        src={UploadImage}
        alt="Upload"
      />
      <UploadFiles type="button" />
    </div>
  );
}
