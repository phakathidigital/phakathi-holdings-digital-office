const DEFAULT_MODEL = process.env.OPENAI_MEETING_MODEL || "gpt-4.1-mini";

function cleanLine(line = "") {
  return String(line).replace(/^[-*•\d.)\s]+/, "").trim();
}

function unique(items = []) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
}

function toIsoDate(value = "") {
  const match = String(value).match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return match?.[1] || "";
}

function inferPriority(text = "") {
  const lower = text.toLowerCase();
  if (/(urgent|critical|immediately|blocker|risk)/.test(lower)) return "critical";
  if (/(important|high|deadline|friday|monday|this week)/.test(lower)) return "high";
  if (/(follow up|prepare|review|send|share|confirm|update)/.test(lower)) return "medium";
  return "low";
}

function inferAssignee(text = "", attendees = []) {
  const lower = text.toLowerCase();
  const attendee = attendees.find((person) => {
    const [first] = String(person).toLowerCase().split(/[.\s@_-]+/);
    return first && lower.includes(first);
  });
  return attendee && attendee.includes("@") ? attendee : "";
}

function fallbackMeetingAnalysis({ title, meeting_date, subsidiary, attendees = [], transcript = "" }) {
  const lines = transcript.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const actionLines = lines.filter((line) => /\b(to|will|must|action|follow up|prepare|send|share|confirm|complete|review|update|assign)\b/i.test(line));
  const decisionLines = lines.filter((line) => /\b(decided|decision|agreed|approved|resolved|confirmed)\b/i.test(line));
  const topicLines = lines.filter((line) => !actionLines.includes(line) && !decisionLines.includes(line)).slice(0, 8);
  const extractedTasks = unique(actionLines).slice(0, 12).map((line) => ({
    title: line.length > 90 ? `${line.slice(0, 87)}...` : line,
    description: `Extracted from ${title} on ${meeting_date}. ${line}`,
    assigned_to: inferAssignee(line, attendees),
    priority: inferPriority(line),
    due_date: toIsoDate(line),
  }));

  const summary = [
    `${title} focused on ${subsidiary || "Phakathi Holdings"} execution alignment, project follow-up, accountability, and next actions.`,
    topicLines.length
      ? `Main discussion themes included: ${topicLines.slice(0, 4).join("; ")}.`
      : "The transcript did not contain enough detail for deep thematic analysis, but the meeting record is ready for manual refinement.",
  ].join("\n\n");

  const individual_summaries = Object.fromEntries(attendees.map((attendee) => {
    const relevant = lines.filter((line) => line.toLowerCase().includes(String(attendee).split(/[.\s@_-]+/)[0]?.toLowerCase())).slice(0, 3);
    return [attendee, relevant.length ? relevant.join(" ") : "No specific personal actions were detected; review the meeting action items for shared responsibilities."];
  }));

  return {
    summary,
    decisions: unique(decisionLines).slice(0, 10),
    action_items: unique(actionLines).slice(0, 12),
    structured_notes: [
      `Meeting: ${title}`,
      `Date: ${meeting_date}`,
      `Subsidiary: ${subsidiary || "Group"}`,
      "",
      "Agenda / Discussion",
      ...(topicLines.length ? topicLines.map((line) => `- ${line}`) : ["- Transcript captured for review."]),
      "",
      "Decisions",
      ...(decisionLines.length ? unique(decisionLines).map((line) => `- ${line}`) : ["- No explicit decisions detected."]),
      "",
      "Action Items",
      ...(actionLines.length ? unique(actionLines).map((line) => `- ${line}`) : ["- No explicit action items detected."]),
    ].join("\n"),
    individual_summaries,
    extracted_tasks: extractedTasks,
    ai_provider: "local_fallback",
    ai_note: "Processed with deterministic local fallback because OPENAI_API_KEY is not configured.",
  };
}

function schemaPrompt({ title, meeting_date, subsidiary, attendees = [], transcript = "" }) {
  return `You are the Meeting Studio analyst for Phakathi Holdings, a South African group/shared-services company.

The app must support weekly Monday alignment, company execution discipline, accountability, education-focused strategy, Empoweryst funding/BBBEE execution, DAM discipline, and project follow-up.

Return ONLY valid JSON with:
{
  "summary": string,
  "decisions": string[],
  "action_items": string[],
  "structured_notes": string,
  "individual_summaries": { "attendee": "summary" },
  "attendee_summaries": [{ "attendee": string, "summary": string, "actions": string[] }],
  "extracted_tasks": [{ "title": string, "description": string, "assigned_to": string, "priority": "low"|"medium"|"high"|"critical", "due_date": string }]
}

Rules:
- Use concise professional business language.
- Extract only concrete Kanban tasks with clear outcomes.
- Match assignees to attendee emails/names where possible.
- Use ISO YYYY-MM-DD dates when deadlines are clear, otherwise empty string.
- Include decisions separately from action items.
- For attendee summaries, explain what each person/team needs to know or do.

Meeting title: ${title}
Date: ${meeting_date}
Subsidiary/team: ${subsidiary || "Group"}
Attendees: ${attendees.join(", ") || "Not specified"}

Transcript:
${transcript}`;
}

async function callOpenAI(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: schemaPrompt(payload),
      text: {
        format: {
          type: "json_schema",
          name: "meeting_studio_analysis",
          strict: false,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              decisions: { type: "array", items: { type: "string" } },
              action_items: { type: "array", items: { type: "string" } },
              structured_notes: { type: "string" },
              individual_summaries: { type: "object", additionalProperties: { type: "string" } },
              attendee_summaries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    attendee: { type: "string" },
                    summary: { type: "string" },
                    actions: { type: "array", items: { type: "string" } },
                  },
                },
              },
              extracted_tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    assigned_to: { type: "string" },
                    priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    due_date: { type: "string" },
                  },
                },
              },
            },
            required: ["summary", "decisions", "action_items", "structured_notes", "individual_summaries", "extracted_tasks"],
          },
        },
      },
    }),
  });

  if (!response.ok) throw new Error(`OpenAI meeting analysis failed (${response.status})`);
  const data = await response.json();
  const outputText = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!outputText) throw new Error("OpenAI returned no meeting analysis text");
  return JSON.parse(outputText);
}

export async function analyzeMeetingTranscript(payload) {
  try {
    const openAiResult = await callOpenAI(payload);
    if (openAiResult) {
      return {
        ...openAiResult,
        extracted_tasks: (openAiResult.extracted_tasks || []).map((task) => ({
          title: task.title || "Meeting follow-up",
          description: task.description || "",
          assigned_to: task.assigned_to || "",
          priority: ["low", "medium", "high", "critical"].includes(task.priority) ? task.priority : "medium",
          due_date: task.due_date || "",
        })),
        ai_provider: "openai",
        ai_model: DEFAULT_MODEL,
      };
    }
  } catch (error) {
    return {
      ...fallbackMeetingAnalysis(payload),
      ai_note: `OpenAI processing failed; local fallback used. ${error.message}`,
    };
  }
  return fallbackMeetingAnalysis(payload);
}

