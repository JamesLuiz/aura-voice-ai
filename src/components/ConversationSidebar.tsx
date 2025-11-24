import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, User, Bot } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationSidebarProps {
  messages: Message[];
}

export function ConversationSidebar({ messages }: ConversationSidebarProps) {
  const { state } = useSidebar();
  const { toast } = useToast();
  const isCollapsed = state === "collapsed";

  const exportTranscript = () => {
    if (messages.length === 0) {
      toast({
        title: "No messages",
        description: "There are no messages to export yet.",
        variant: "destructive",
      });
      return;
    }

    const transcript = messages
      .map(
        (msg) =>
          `[${msg.timestamp.toLocaleTimeString()}] ${
            msg.role === "user" ? "You" : "Voxa"
          }: ${msg.content}`
      )
      .join("\n\n");

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voxa-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Transcript exported",
      description: "Your conversation has been downloaded.",
    });
  };

  const exportJSON = () => {
    if (messages.length === 0) {
      toast({
        title: "No messages",
        description: "There are no messages to export yet.",
        variant: "destructive",
      });
      return;
    }

    const json = JSON.stringify(messages, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voxa-conversation-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: "Your conversation data has been downloaded as JSON.",
    });
  };

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-80"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-4">
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Conversation</h2>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={exportTranscript}
                title="Export as text"
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="flex items-center justify-between px-2">
              <span>Messages ({messages.length})</span>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportJSON}
                  className="h-7 text-xs"
                >
                  Export JSON
                </Button>
              )}
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-180px)]">
              <SidebarMenu>
                {messages.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {!isCollapsed && "No messages yet. Start a conversation!"}
                  </div>
                ) : (
                  <div className="space-y-3 p-3">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex gap-3 ${isCollapsed ? "justify-center" : ""}`}
                      >
                        {isCollapsed ? (
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              message.role === "user"
                                ? "bg-primary/10"
                                : "bg-accent/10"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User className="h-4 w-4 text-primary" />
                            ) : (
                              <Bot className="h-4 w-4 text-accent" />
                            )}
                          </div>
                        ) : (
                          <>
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                message.role === "user"
                                  ? "bg-primary/10"
                                  : "bg-accent/10"
                              }`}
                            >
                              {message.role === "user" ? (
                                <User className="h-4 w-4 text-primary" />
                              ) : (
                                <Bot className="h-4 w-4 text-accent" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">
                                  {message.role === "user" ? "You" : "Voxa"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-foreground break-words">
                                {message.content}
                              </p>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
