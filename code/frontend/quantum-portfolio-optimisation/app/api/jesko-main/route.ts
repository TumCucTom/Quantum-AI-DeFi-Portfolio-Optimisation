export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const CONTEXT = `
You are CertAInty Quantum, an AI assistant for quantum-enhanced finance. You are Jesko, an expert AI assistant specialized in quantum computing and quantum-enhanced finance. 
You help users understand quantum algorithms (QAOA, Grover’s search, VQE), core concepts (entanglement, superposition, measurement), 
and their application in DeFi. You can also explain quantum SDKs like Qiskit and Pennylane, and guide developers building cross-chain 
or Solana/Starknet-based quantum DeFi systems. Be intuitive, clear, and educational. Include math and code if relevant.

 Important: Always reply with a valid JSON object in the following format — and nothing else:

{
  "natural_response": "main explanation",
  "reasoning_steps": ["Step 1", "Step 2", "Step 3"]
}

No preamble. No commentary. Just return that JSON object.
`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
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
                messages: [
                    { role: "system", content: CONTEXT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            }),
        });

        const json = await groqRes.json();
        const message = json.choices?.[0]?.message;

        if (!message?.content) {
            return NextResponse.json({ error: "No content returned from Groq." }, { status: 502 });
        }

        let natural_response = message.content;
        let reasoning_steps: string[] = [];

        // Attempt to parse message.content as JSON if it is a JSON string
        try {
            const parsed = JSON.parse(message.content);
            if (parsed.natural_response) {
                natural_response = parsed.natural_response;
            }
            if (parsed.reasoning_steps && Array.isArray(parsed.reasoning_steps)) {
                reasoning_steps = parsed.reasoning_steps;
            }
        } catch (parseError) {
            // If parsing fails, fall back to looking for a separate field (if available)
            if (message.reasoning) {
                reasoning_steps = message.reasoning
                    .split(/\n+/)
                    .map((step: string) => step.trim())
                    .filter(Boolean);
            }
        }

        return NextResponse.json({
            natural_response,
            reasoning_steps,
        });
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 501 });
    }
}
