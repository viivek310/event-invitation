import type { ComponentType } from "react";

export type InvitationContent = {
  partnerOne: string;
  partnerTwo: string;
  message: string;
  weddingDate: string;
  venue: string;
  family: string;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  category: "Wedding";
  schemaVersion: 1;
  status: "preview" | "planned";
  palette: readonly string[];
  thumbnail?: string;
  sections: readonly string[];
  demo: InvitationContent;
};

export type TemplateProps = {
  content: InvitationContent;
  mode: "demo" | "sandbox" | "preview" | "live";
  sections?: readonly string[];
  live?: { slug: string; partyLimit: number; dietaryEnabled: boolean; accommodationEnabled: boolean };
};

export type TemplateRenderer = ComponentType<TemplateProps>;
