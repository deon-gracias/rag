"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { delete_chat_session, get_sessions } from "@/lib/requests";
import { useSessionStore } from "@/store/session";
import { PlusIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

export function AppSidebar() {
  const session = useSessionStore();

  React.useEffect(() => {
    get_sessions().then((s) => {
      session.set_sessions(s);
    });
  }, []);

  return (
    <Sidebar>
      <SidebarHeader />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/"
                  title="New chat"
                  className={buttonVariants({ variant: "outline" })}
                >
                  <PlusIcon />
                  <span>New Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {session.all.map((item, index) => (
              <SidebarMenuItem
                key={item.name}
                className="flex col-gap-1 items-center h-9 group"
              >
                <SidebarMenuButton asChild>
                  <Link
                    href={`/chat/${item.name}`}
                    title={item.name}
                    className="h-full"
                  >
                    <span className="truncate">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
                <Button
                  size="icon"
                  variant={"ghost"}
                  className={`group-hover:block hidden px-2`}
                  onClick={async () => {
                    console.log(item.id);
                    session.set_sessions([
                      ...session.all.slice(0, index),
                      ...session.all.splice(index + 1),
                    ]);
                    await delete_chat_session(item.id);
                  }}
                >
                  <TrashIcon className="size-2" />
                </Button>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
