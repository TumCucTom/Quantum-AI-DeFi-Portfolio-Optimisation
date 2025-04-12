export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("Incoming body:", body);

        const { prompt, userApiKey } = body;

        if (!userApiKey || !prompt) {
            return NextResponse.json({ error: "Missing API key or prompt." }, { status: 400 });
        }

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userApiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
            }),
        });

        const text = await groqRes.text();
        console.log("Groq raw response:", text);

        if (!groqRes.ok) {
            return NextResponse.json({ error: text }, { status: groqRes.status });
        }

        const json = JSON.parse(text); // safely parse now
        return NextResponse.json(json);
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 501 });
    }
}
