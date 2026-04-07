// ─── TAJWEED TAG DEFINITIONS ─────────────────────────────────────────────────
export const TAJWEED_TAGS = [
  { tag: "⟪مد جائز⟫", color: "#E69F00" }, // orange
  { tag: "⟪مد طبيعي⟫", color: "#56B4E9" }, // sky blue
  { tag: "⟪مد لازم⟫", color: "#009E73" }, // bluish green
  { tag: "⟪مد واجب⟫", color: "#F0E442" }, // yellow (use with bold text)

  { tag: "⟪إقلاب⟫", color: "#0072B2" }, // strong blue
  { tag: "⟪إخفاء شفوي⟫", color: "#D55E00" }, // vermillion (safe red-orange)
  { tag: "⟪إخفاء⟫", color: "#CC79A7" }, // pink/purple

  { tag: "⟪غنة⟫", color: "#009E73" }, // reuse green but distinguish via bold
  { tag: "⟪قلقلة⟫", color: "#999999" }, // neutral gray

  { tag: "⟪إدغام بغنة⟫", color: "#0072B2" }, // reuse blue family
  { tag: "⟪إدغام بغير غنة⟫", color: "#E69F00" }, // reuse orange

  { tag: "⟪إدغام شفوي⟫", color: "#D55E00" }, // reuse vermillion
  { tag: "⟪إدغام متجانسين⟫", color: "#56B4E9" }, // reuse sky blue
  { tag: "⟪إدغام متقاربين⟫", color: "#CC79A7" }, // reuse purple
];
const tajweedMap = new Map(TAJWEED_TAGS.map((t) => [t.tag, t.color]));

export const tajweedRegex = new RegExp(
  `(${TAJWEED_TAGS.map((t) =>
    t.tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|")})`,
  "g",
);

// Returns an HTML string with the first grapheme of each tagged segment coloured
export function processTajweedTags(text) {
  if (!text) return "";
  const parts = text.split(tajweedRegex);
  let result = "";
  let pendingColor = null;

  for (const part of parts) {
    if (tajweedMap.has(part)) {
      pendingColor = tajweedMap.get(part);
    } else if (pendingColor) {
      const graphemes = [...part.matchAll(/\P{M}\p{M}*/gu)].map((m) => m[0]);
      if (graphemes.length > 0) {
        result += `<span style="color:${pendingColor};font-weight:700">${graphemes[0]}</span>`;
        result += graphemes.slice(1).join("");
      } else {
        result += part;
      }
      pendingColor = null;
    } else {
      result += part;
    }
  }
  return result;
}

// ─── DIFF HIGHLIGHT ───────────────────────────────────────────────────────────
function tokenizeArabic(str) {
  return [...str.matchAll(/\P{M}\p{M}*/gu)].map((m) => m[0]);
}

function lcsTokens(a, b) {
  const m = a.length,
    n = b.length;

  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1].char === b[j - 1].char
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const ops = [];
  let i = m,
    j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1].char === b[j - 1].char) {
      ops.push({
        type: "same",
        a: a[i - 1],
        b: b[j - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({
        type: "ins",
        b: b[j - 1],
      });
      j--;
    } else {
      ops.push({
        type: "del",
        a: a[i - 1],
      });
      i--;
    }
  }

  return ops.reverse();
}

function tokenizeWithTajweed(text) {
  const tokens = [];
  let currentTag = null;

  const parts = text.split(tajweedRegex);

  for (const part of parts) {
    if (tajweedMap.has(part)) {
      currentTag = part;
    } else {
      const graphemes = [...part.matchAll(/\P{M}\p{M}*/gu)].map((m) => m[0]);

      for (let i = 0; i < graphemes.length; i++) {
        tokens.push({
          char: graphemes[i],
          tajweed: i === 0 ? currentTag : null,
        });
        currentTag = null;
      }
    }
  }

  return tokens;
}

// Highlights characters present in `correct` but missing from `incorrect`
export function highlightDiff(correctText, incorrectText) {
  const correctTokens = tokenizeWithTajweed(correctText);
  const incorrectTokens = tokenizeWithTajweed(incorrectText);

  const ops = lcsTokens(correctTokens, incorrectTokens);

  return ops
    .map((op) => {
      // SAME CHARACTER
      if (op.type === "same") {
        const { char, tajweed } = op.a;

        const color = tajweed ? tajweedMap.get(tajweed) : null;

        const missingTajweed = tajweed && !op.b.tajweed;

        return `<span style="
          ${color ? `color:${color};font-weight:700;` : ""}
          ${
            missingTajweed
              ? "background:rgba(180,50,50,0.18);border-radius:2px;padding:0 1px;"
              : ""
          }
        ">${char}</span>`;
      }

      // MISSING CHARACTER (present in correct, missing in incorrect)
      if (op.type === "del") {
        const { char, tajweed } = op.a;
        const color = tajweed ? tajweedMap.get(tajweed) : null;

        return `<mark style="
          background:rgba(180,50,50,0.18);
          color:${color || "#8B1A2A"};
          border-radius:2px;
          padding:0 1px;
          font-weight:700;
        ">${char}</mark>`;
      }

      // EXTRA CHARACTER (ignore)
      return "";
    })
    .join("");
}
