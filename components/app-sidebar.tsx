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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Plus,
  Pin,
  MessageSquare,
  Clock,
  Menu,
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
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleNewChat = () => {
    onNewChat();
    if (isMobile) setOpenMobile(false);
  };

  const handleSelectChat = (id: string) => {
    onSelectChat(id);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-0">
        <div className={`flex h-14 items-center px-3 ${isCollapsed ? "justify-center" : "justify-start"}`}>
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleNewChat}
                className="justify-start gap-3 rounded-lg border border-dashed border-sidebar-border bg-transparent hover:border-sidebar-foreground/30"
              >
                <Plus className="h-4 w-4" />
                <span>New chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {!isCollapsed && <SidebarSeparator />}

        {/* Pinned Chats */}
        {!isCollapsed && pinnedChats.length > 0 && (
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
                      onClick={() => handleSelectChat(chat.id)}
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
        {!isCollapsed && recentChats.length > 0 && (
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
                      onClick={() => handleSelectChat(chat.id)}
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

    </Sidebar>
  );
}
