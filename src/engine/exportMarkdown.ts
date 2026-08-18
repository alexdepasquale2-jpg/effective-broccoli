import { BLOCKS } from "./blocks";
import { formatForcedHand } from "./forcedHand";
import { getProtocol } from "./protocols";
import { sessionTitle } from "./session";
import type { Session } from "../types";

export function sessionToMarkdown(session: Session): string {
  const lines: string[] = [];
  const title = sessionTitle(session);
  lines.push(`# Beat card — ${title}`);
  lines.push("");
  lines.push(`- Started: ${session.createdAt}`);
  if (session.completedAt) {
    lines.push(`- Completed: ${session.completedAt}`);
  }
  if (session.blockId) {
    const block = BLOCKS.find((item) => item.id === session.blockId);
    lines.push(`- Block: ${block?.title ?? session.blockId}`);
  }
  if (session.protocolId) {
    lines.push(`- Protocol: ${getProtocol(session.protocolId).name}`);
  }
  lines.push("");

  const ctx = session.context;
  if (ctx.title || ctx.fantasy || ctx.verbs.length || ctx.alreadyTrue || ctx.stuckSentence) {
    lines.push("## Context");
    if (ctx.title) {
      lines.push(`- Working title: ${ctx.title}`);
    }
    if (ctx.fantasy) {
      lines.push(`- Fantasy of play: ${ctx.fantasy}`);
    }
    if (ctx.verbs.length > 0) {
      lines.push(`- Verbs: ${ctx.verbs.join(", ")}`);
    }
    if (ctx.alreadyTrue) {
      lines.push(`- Already true: ${ctx.alreadyTrue}`);
    }
    if (ctx.stuckSentence) {
      lines.push(`- Stuck: ${ctx.stuckSentence}`);
    }
    lines.push("");
  }

  if (session.forcedHand) {
    lines.push("## Forced Hand");
    lines.push("```");
    lines.push(formatForcedHand(session.forcedHand));
    lines.push("```");
    lines.push("");
  }

  if (session.constraints.length > 0) {
    lines.push("## Constraints drawn");
    for (const constraint of session.constraints) {
      lines.push(`- ${constraint}`);
    }
    lines.push("");
  }

  if (session.protocolId) {
    const protocol = getProtocol(session.protocolId);
    lines.push("## Protocol notes");
    lines.push("");
    for (const step of protocol.steps) {
      const answer = (session.answers[step.id] ?? "").trim();
      lines.push(`### ${step.title}`);
      lines.push("");
      lines.push(answer.length > 0 ? answer : "_unanswered_");
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("Generated with Next Beat. One playable scene is a complete session.");
  lines.push("");
  return lines.join("\n");
}

export function downloadText(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.length > 0 ? slug : "beat-card";
}
