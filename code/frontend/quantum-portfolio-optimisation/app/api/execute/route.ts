export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("Incoming body:", body);

        const { prompt, userApiKey, active } = body;

        // Ensure that API key, prompt, and active enhancements (as an array) are provided
        if (!userApiKey || !prompt || !active || !Array.isArray(active)) {
            return NextResponse.json({ error: "Missing API key, prompt or active enhancements." }, { status: 400 });
        }

        // First, call Brian's parameters-extraction endpoint
        const brianRes = await fetch("https://api.brianknows.org/api/v0/agent/parameters-extraction", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-brian-api-key": userApiKey,
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!brianRes.ok) {
            return NextResponse.json({ error: "Error from Brian API extraction." }, { status: brianRes.status });
        }

        const brianJson = await brianRes.json();
        console.log("Brian response:", brianJson);

        // Extract the intent from Brian's response; adjust property name if necessary
        const brianIntent = brianJson.intent;

        // Mapping dictionary: each enhancement maps to an array of supported actions
        const enhancementMapping: Record<string, string[]> = {
            vwap: ["swap", "transfer"],
            twap: ["swap", "transfer"],
            quantumEnhancedOrderSlicing: ["swap", "borrow and repay"],
            quantumEnhancedOrderRouting: ["swap", "bridge and cross-chain swap"],
            latencyCostAwareness: ["swap", "deposit", "withdraw", "borrow and repay"],
        };

        // Check if any active enhancement includes the extracted intent
        let shouldCallLocalApi = false;
        for (const enhancement of active) {
            if (enhancementMapping[enhancement] && enhancementMapping[enhancement].includes(brianIntent)) {
                shouldCallLocalApi = true;
                break;
            }
        }

        // If there's a matching active enhancement, call the local API and then the transaction endpoint for each trade
        if (shouldCallLocalApi) {
            console.log("Matching enhancement found. Calling local API...");
            const localApiRes = await fetch("http://localhost:5002/api/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-brian-api-key": userApiKey,
                },
                body: JSON.stringify({ prompt: prompt }),
            });
            if (!localApiRes.ok) {
                return NextResponse.json({ error: "Error from local API call." }, { status: localApiRes.status });
            }
            const localData = await localApiRes.json();
            console.log("Local API response:", localData);

            // Normalize the response: if it's not already an array, convert it into one.
            const trades = Array.isArray(localData)
                ? localData
                : localData.trades
                    ? localData.trades
                    : [localData];

            // For every trade, call Brian's transaction endpoint
            const transactions = await Promise.all(
                trades.map(async (trade: any) => {
                    const transactionRes = await fetch("https://api.brianknows.org/api/v0/agent/transaction", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-brian-api-key": userApiKey,
                        },
                        body: JSON.stringify(trade),
                    });
                    if (!transactionRes.ok) {
                        throw new Error(`Transaction API call failed for trade: ${JSON.stringify(trade)}`);
                    }
                    return await transactionRes.json();
                })
            );

            // Return the aggregated transactions
            return NextResponse.json({ transactions });
        } else {
            console.log("No active enhancement matches the brian intent. Returning initial extraction result.");
            return NextResponse.json(brianJson);
        }
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 501 });
    }
}
