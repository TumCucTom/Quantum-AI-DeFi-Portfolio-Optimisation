export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("Incoming body:", body);

        const { prompt, userApiKey, active, address } = body;

        // Validate inputs
        if (!userApiKey || !prompt || !active || !Array.isArray(active) || !address) {
            return NextResponse.json({ error: "Missing API key, prompt, active enhancements, or address." }, { status: 400 });
        }

        // Step 1: Extract parameters from Brian
        const brianRes = await fetch("https://api.brianknows.org/api/v0/agent/parameters-extraction", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-brian-api-key": userApiKey,
            },
            body: JSON.stringify({ prompt }),
        });

        if (!brianRes.ok) {
            return NextResponse.json({ error: "Error from Brian API extraction." }, { status: brianRes.status });
        }

        const brianJson = await brianRes.json();
        console.log("Brian response:", brianJson);

        const brianIntent = brianJson.intent;

        const enhancementMapping: Record<string, string[]> = {
            vwap: ["swap", "transfer"],
            twap: ["swap", "transfer"],
            quantumEnhancedOrderSlicing: ["swap", "borrow and repay"],
            quantumEnhancedOrderRouting: ["swap", "bridge and cross-chain swap"],
            latencyCostAwareness: ["swap", "deposit", "withdraw", "borrow and repay"],
        };

        const shouldCallLocalApi = active.some(
            (enhancement) =>
                enhancementMapping[enhancement] &&
                enhancementMapping[enhancement].includes(brianIntent)
        );

        if (shouldCallLocalApi) {
            console.log("Matching enhancement found. Calling local API...");

            const localApiRes = await fetch("http://localhost:5002/api/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-brian-api-key": userApiKey,
                },
                body: JSON.stringify({ prompt }),
            });

            if (!localApiRes.ok) {
                return NextResponse.json({ error: "Error from local API call." }, { status: localApiRes.status });
            }

            const localData = await localApiRes.json();
            console.log("Local API response:", localData);

            const trades = Array.isArray(localData)
                ? localData
                : localData.trades
                    ? localData.trades
                    : [localData];

            const transactions = await Promise.all(
                trades.map(async (trade: any) => {
                    const transactionRes = await fetch("https://api.brianknows.org/api/v0/agent/transaction", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-brian-api-key": userApiKey,
                        },
                        body: JSON.stringify({ ...trade, address }),
                    });

                    if (!transactionRes.ok) {
                        throw new Error(`Transaction API call failed for trade: ${JSON.stringify(trade)}`);
                    }

                    return await transactionRes.json();
                })
            );

            return NextResponse.json({ transactions });
        } else {
            console.log("No matching enhancements. Using original prompt for transaction call.");

            const fallbackTransactionRes = await fetch("https://api.brianknows.org/api/v0/agent/transaction", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-brian-api-key": userApiKey,
                },
                body: JSON.stringify({ address, prompt }),
            });

            if (!fallbackTransactionRes.ok) {
                return NextResponse.json({ error: "Fallback transaction call failed." }, { status: fallbackTransactionRes.status });
            }

            const fallbackTransactionJson = await fallbackTransactionRes.json();
            return NextResponse.json({ transactions: [fallbackTransactionJson] });
        }
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 501 });
    }
}
