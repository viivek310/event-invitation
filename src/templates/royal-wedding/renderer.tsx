"use client";
import { useState } from "react";
import type { TemplateProps } from "../types";
import { RoyalOpening } from "./opening/royal-opening";
import type { OpeningPhase } from "./opening/config";
import { RoyalWeddingBody } from "./invitation";
import type { RoyalWeddingContent } from "./content";
import { ArtworkContext } from "./artwork-context";
const defaultSections = ["opening","ganesha","invitation","date","events","invitee"];
export default function RoyalWeddingRenderer({ content, mode, sections = defaultSections, live }: TemplateProps) {
  const [phase,setPhase] = useState<OpeningPhase>("loading");
  const [revision,setRevision] = useState(0);
  // Every server entry point validates complete template-specific content.
  // No real invitation may fall back to the demo dataset.
  const data = content as RoyalWeddingContent;
  return <ArtworkContext.Provider value={data.artworkOverrides}><div style={{position:"relative",width:"100%",height:"100dvh",minHeight:360,backgroundColor:"#501B2B",color:"#F7F0E2"}}>
    <RoyalOpening key={revision} openingEnabled={sections.includes("opening")} ganeshaEnabled={sections.includes("ganesha")} onPhaseChange={setPhase} onRetry={()=>{setPhase("loading");setRevision(value=>value+1);}}>
      <RoyalWeddingBody content={data} active={phase==="complete"} mode={mode==="live"?"live":mode==="demo"?"demo":"admin-review"} sections={sections} live={live}/>
    </RoyalOpening>
  </div></ArtworkContext.Provider>;
}
