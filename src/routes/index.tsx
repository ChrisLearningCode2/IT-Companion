import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeBase } from "@/components/KnowledgeBase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IT Knowledge Base — notes, commands & how-tos" },
      { name: "description", content: "A portable IT knowledge base with how-tos, PowerShell and CMD library, protocols, AD, Intune and Microsoft 365 guides." },
      { property: "og:title", content: "IT Knowledge Base" },
      { property: "og:description", content: "Portable, editable IT how-tos, command library and troubleshooting notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KnowledgeBase,
});
