import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json(); // { date, weekly_goal, entry }
  const { weekly_goal, entry } = body;

  // If OPENAI_API_KEY present, call the model; else return stub
  if (process.env.OPENAI_API_KEY) {
    try {
      const out = await callDailyModel({ weekly_goal, entry });
      return NextResponse.json(out);
    } catch (e:any) {
      console.error(e);
    }
  }
  // Stub
  return NextResponse.json({
    theme: "Plan then Play",
    action: "Block 45 minutes for your A+ at 9:00—no messages.",
  });
}

async function callDailyModel(payload: any) {
  // Keep prompts tiny (fast & cheap)
  const system = `You are a concise daily coach. Return STRICT JSON: {"theme":string<=40, "action":string<=140}. Avoid therapy language.`;
  const user = JSON.stringify({
    weekly_goal: payload.weekly_goal,
    today: {
      intention: payload.entry?.intention ?? "",
      aplus: payload.entry?.aplus ?? "",
      completed_pct: payload.entry?.completedPct ?? 0,
      daily_score: payload.entry?.dailyScore ?? 0,
      routines_done: payload.entry?.routines?.filter((r:any)=>r.checked).map((r:any)=>r.title),
      todos_done: payload.entry?.todos?.filter((t:any)=>t.checked).map((t:any)=>t.text)
    }
  });

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const resp = await client.chat.completions.create({
    model, temperature: 0.2, response_format:{ type:"json_object" },
    messages: [{role:"system",content:system},{role:"user",content:user}]
  });
  const text = resp.choices[0]?.message?.content || "{}";
  const json = JSON.parse(text);
  return { theme: String(json.theme||"Focus First"), action: String(json.action||"Start a 45-min focus block.") };
}
