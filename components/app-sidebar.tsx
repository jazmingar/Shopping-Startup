"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Plus,
  Pin,
  MessageSquare,
  Settings,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PinnedChat {
  id: string;
  title: string;
  timestamp: Date;
}

export interface RecentChat {
  id: string;
  title: string;
  timestamp: Date;
}

interface AppSidebarProps {
  pinnedChats: PinnedChat[];
  recentChats: RecentChat[];
  activeChat: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

export function AppSidebar({
  pinnedChats,
  recentChats,
  activeChat,
  onNewChat,
  onSelectChat,
}: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
            <Sparkles className="h-5 w-5 text-background" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold tracking-tight text-sidebar-foreground">
              Drape
            </h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onNewChat}
                className="justify-start gap-3 rounded-lg border border-dashed border-sidebar-border bg-transparent hover:border-sidebar-foreground/30"
              >
                <Plus className="h-4 w-4" />
                <span>New chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Pinned Chats */}
        {pinnedChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              <Pin className="h-3 w-3" />
              Pinned
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pinnedChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectChat(chat.id)}
                      isActive={activeChat === chat.id}
                      className={cn(
                        "justify-start gap-3 rounded-lg",
                        activeChat === chat.id && "bg-sidebar-accent"
                      )}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Recent Chats */}
        {recentChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              <Clock className="h-3 w-3" />
              Recent
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectChat(chat.id)}
                      isActive={activeChat === chat.id}
                      className={cn(
                        "justify-start gap-3 rounded-lg",
                        activeChat === chat.id && "bg-sidebar-accent"
                      )}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="justify-start gap-3 rounded-lg">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
