import { describe, expect, it } from "vitest";
import { escapeHtml, formatClock, nl2br, parseVerbs, renderRichText } from "./format";

describe("format helpers", () => {
  it("escapes html", () => {
    expect(escapeHtml(`<b>"x"&y'</b>`)).toBe("&lt;b&gt;&quot;x&quot;&amp;y&#39;&lt;/b&gt;");
  });

  it("formats clocks", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(75)).toBe("01:15");
    expect(formatClock(-3)).toBe("00:00");
  });

  it("turns newlines into breaks after escaping", () => {
    expect(nl2br("a\n<b>")).toBe("a<br />&lt;b&gt;");
  });

  it("parses unique verbs", () => {
    expect(parseVerbs("Bribe, dive\ndive, ")).toEqual(["bribe", "dive"]);
  });

  it("renders bold after escaping", () => {
    expect(renderRichText("Use **Verb Tax** <x>")).toBe("Use <strong>Verb Tax</strong> &lt;x&gt;");
  });
});
