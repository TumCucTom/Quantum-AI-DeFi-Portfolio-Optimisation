"use client";

// Global declaration (can be in a separate types file as well)
declare global {
    interface Window {
        ethereum?: any;
    }
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Eye, Percent, Wallet } from "lucide-react";
import { ethers } from "ethers";

export default function PortfolioPage() {
    // --- UI Mode state ---
    const [isAdvancedMode, setIsAdvancedMode] = useState(true);

    // --- Wallet connection state ---
    const [connectedWallet, setConnectedWallet] = useState<string>("");

    // --- ETH tab state ---
    const [ethWallet, setEthWallet] = useState("");
    const [ethUSDT, setEthUSDT] = useState("");
    const [ethUSDC, setEthUSDC] = useState("");
    const [ethSOL, setEthSOL] = useState("");

    // --- Solana tab state ---
    const [solWallet, setSolWallet] = useState("");
    const [solUSDT, setSolUSDT] = useState("");
    const [solUSDC, setSolUSDC] = useState("");
    const [solBNB, setSolBNB] = useState("");

    // --- BNB tab state ---
    const [bnbWallet, setBnbWallet] = useState("");
    const [bnbUSDT, setBnbUSDT] = useState("");
    const [bnbUSDC, setBnbUSDC] = useState("");
    const [bnbETH, setBnbETH] = useState("");

    // --- Balance states for each chain (native tokens) ---
    const [ethBalance, setEthBalance] = useState("");
    const [solBalance, setSolBalance] = useState("");
    const [bnbBalance, setBnbBalance] = useState("");

    // --- Additional logs for price feeds & swaps ---
    const [priceFeedLog, setPriceFeedLog] = useState("");
    const [swapLog, setSwapLog] = useState("");

    // ---------------------------------------------------------------------
    // Connect Wallet – uses MetaMask to get signer and connected address.
    async function connectWallet() {
        if (!window.ethereum) {
            alert("MetaMask is not installed");
            return;
        }
        try {
            const accounts: string[] = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            setConnectedWallet(accounts[0]);
            // Optionally, also fill in the ETH Wallet input automatically:
            setEthWallet(accounts[0]);
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    }

    // ---------------------------------------------------------------------
    // Fetch ETH Balance using ethers v5 and Infura.
    async function fetchEthBalance(wallet: string): Promise<string> {
        try {
            const provider = new ethers.providers.JsonRpcProvider(
                "https://mainnet.infura.io/v3/3fb074b72df549aa82cdbbde363970c4"
            );
            const balance = await provider.getBalance(wallet);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Error fetching ETH balance:", error);
            return "Error";
        }
    }

    // ---------------------------------------------------------------------
    // Fetch SOL Balance using dynamic import of @solana/web3.js (runs only on client)
    async function fetchSolBalance(wallet: string): Promise<string> {
        try {
            const solanaWeb3 = await import("@solana/web3.js");
            const { Connection, PublicKey } = solanaWeb3;
            const connection = new Connection("https://api.mainnet-beta.solana.com");
            const publicKey = new PublicKey(wallet);
            const lamports = await connection.getBalance(publicKey);
            return (lamports / 1e9).toFixed(4);
        } catch (error) {
            console.error("Error fetching SOL balance:", error);
            return "Error";
        }
    }

    // ---------------------------------------------------------------------
    // Fetch BNB Balance using ethers v5 and BSC RPC.
    async function fetchBnbBalance(wallet: string): Promise<string> {
        try {
            const provider = new ethers.providers.JsonRpcProvider(
                "https://bsc-dataseed.binance.org/"
            );
            const balance = await provider.getBalance(wallet);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Error fetching BNB balance:", error);
            return "Error";
        }
    }

    // ---------------------------------------------------------------------
    // Function to fetch all balances for the provided addresses.
    const handleFetchBalances = async () => {
        if (ethWallet) {
            const balance = await fetchEthBalance(ethWallet);
            setEthBalance(balance);
        }
        if (solWallet) {
            const balance = await fetchSolBalance(solWallet);
            setSolBalance(balance);
        }
        if (bnbWallet) {
            const balance = await fetchBnbBalance(bnbWallet);
            setBnbBalance(balance);
        }
    };

    // ---------------------------------------------------------------------
    // STEP 1 (or a placeholder): Fetch Price Feeds
    // In a production app, you'd use a robust oracle integration (like Pyth/Hermes)
    // Here we use placeholder feed IDs.
    async function fetchPriceFeeds() {
        try {
            // For demonstration, we'll simulate fetching prices.
            // Replace the below logic with your real integration.
            const ethPrice = 1800; // Simulated ETH price in USD
            const solPrice = 35; // Simulated SOL price in USD
            setPriceFeedLog(`ETH Price: $${ethPrice}, SOL Price: $${solPrice}`);
        } catch (error) {
            console.error("Error fetching price feeds:", error);
            setPriceFeedLog("Error fetching price feeds.");
        }
    }

    // ---------------------------------------------------------------------
    // STEP 2: Swap entire ETH holdings to USDC on Ethereum using Uniswap V2.
    async function swapEthToUSDC() {
        try {
            if (!window.ethereum) {
                setSwapLog("No Ethereum wallet detected.");
                return;
            }
            // Make sure wallet is connected.
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Uniswap V2 router contract on Ethereum:
            const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
            // USDC token address on Ethereum mainnet:
            const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
            // WETH (wrapped ETH) token address on Ethereum mainnet:
            const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

            // Minimal ABI for the swap function
            const routerAbi = [
                "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
            ];
            const routerContract = new ethers.Contract(routerAddress, routerAbi, signer);

            // Get the signer's address
            const address = await signer.getAddress();
            // Get the available ETH balance
            const balance = await provider.getBalance(address);
            const gasMargin = ethers.utils.parseEther("0.01"); // Reserve 0.01 ETH for gas
            const amountIn = balance.sub(gasMargin);
            if (amountIn.lte(0)) {
                setSwapLog("Insufficient balance for swap after gas margin.");
                return;
            }

            // For demonstration purposes, we set amountOutMin to 0.
            // In production, calculate the minimum acceptable amount using a price oracle.
            const amountOutMin = 0;
            // Swap path: WETH → USDC.
            const path = [wethAddress, usdcAddress];
            const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

            setSwapLog("Initiating swap transaction...");
            const tx = await routerContract.swapExactETHForTokens(
                amountOutMin,
                path,
                address,
                deadline,
                { value: amountIn }
            );
            setSwapLog(`Swap transaction sent: ${tx.hash}`);
            await tx.wait();
            setSwapLog(`Swap confirmed: ${tx.hash}`);
        } catch (error) {
            console.error("Error swapping ETH for USDC:", error);
            setSwapLog("Error swapping ETH for USDC.");
        }
    }

    // ---------------------------------------------------------------------
    // Execute handler for demonstration.
    const handleExecute = () => {
        console.log("ETH Tab:", { ethWallet, ethUSDT, ethUSDC, ethSOL });
        console.log("Solana Tab:", { solWallet, solUSDT, solUSDC, solBNB });
        console.log("BNB Tab:", { bnbWallet, bnbUSDT, bnbUSDC, bnbETH });
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="quantum-grid absolute inset-0 opacity-30" />

            {/* Animated background gradients */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 container mx-auto px-6 py-12">
                <div className="text-center mb-12 floating">
                    <h1 className="quantum-title text-4xl font-bold mb-4">
                        Rebalance Portfolio
                    </h1>
                    <div className="flex items-center justify-center gap-3 text-xl text-blue-200/80">
              <span className={isAdvancedMode ? "opacity-100" : "opacity-50"}>
                Advanced mode
              </span>
                        <Switch
                            checked={isAdvancedMode}
                            onCheckedChange={setIsAdvancedMode}
                            className="quantum-card data-[state=checked]:bg-blue-400"
                        />
                        <span className={!isAdvancedMode ? "opacity-100" : "opacity-50"}>
                Easy mode
              </span>
                    </div>
                    <div className="mt-4">
                        <Button onClick={connectWallet} variant="outline">
                            {connectedWallet ? "Wallet Connected" : "Connect Wallet"}
                        </Button>
                    </div>
                </div>

                <Card className="quantum-card p-8 backdrop-blur-xl">
                    <Tabs defaultValue="eth" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8">
                            <TabsTrigger value="eth" className="text-lg">
                                ETH
                            </TabsTrigger>
                            <TabsTrigger value="solana" className="text-lg">
                                Solana
                            </TabsTrigger>
                            <TabsTrigger value="bnb" className="text-lg">
                                BNB
                            </TabsTrigger>
                        </TabsList>

                        {/* ETH TAB */}
                        <TabsContent value="eth" className="space-y-6">
                            <WalletInput
                                placeholder="ETH Wallet Address"
                                value={ethWallet}
                                onChange={setEthWallet}
                            />
                            {ethWallet && (
                                <p className="text-sm text-gray-400">
                                    Current Balance: {ethBalance ? `${ethBalance} ETH` : "N/A"}
                                </p>
                            )}
                            <div className="grid gap-4">
                                <TokenInput
                                    label="USDT Amount"
                                    value={ethUSDT}
                                    setValue={setEthUSDT}
                                />
                                <TokenInput
                                    label="USDC Amount"
                                    value={ethUSDC}
                                    setValue={setEthUSDC}
                                />
                                <TokenInput
                                    label="SOL Amount"
                                    value={ethSOL}
                                    setValue={setEthSOL}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={swapEthToUSDC}
                                    variant="ghost"
                                    className="quantum-card glow"
                                >
                                    Swap ETH to USDC
                                </Button>
                                {swapLog && <p className="text-sm text-gray-400">{swapLog}</p>}
                            </div>
                        </TabsContent>

                        {/* SOLANA TAB */}
                        <TabsContent value="solana" className="space-y-6">
                            <WalletInput
                                placeholder="Solana Wallet Address"
                                value={solWallet}
                                onChange={setSolWallet}
                            />
                            {solWallet && (
                                <p className="text-sm text-gray-400">
                                    Current Balance: {solBalance ? `${solBalance} SOL` : "N/A"}
                                </p>
                            )}
                            <div className="grid gap-4">
                                <TokenInput
                                    label="USDT Amount"
                                    value={solUSDT}
                                    setValue={setSolUSDT}
                                />
                                <TokenInput
                                    label="USDC Amount"
                                    value={solUSDC}
                                    setValue={setSolUSDC}
                                />
                                <TokenInput
                                    label="BNB Amount"
                                    value={solBNB}
                                    setValue={setSolBNB}
                                />
                            </div>
                        </TabsContent>

                        {/* BNB TAB */}
                        <TabsContent value="bnb" className="space-y-6">
                            <WalletInput
                                placeholder="BNB Wallet Address"
                                value={bnbWallet}
                                onChange={setBnbWallet}
                            />
                            {bnbWallet && (
                                <p className="text-sm text-gray-400">
                                    Current Balance: {bnbBalance ? `${bnbBalance} BNB` : "N/A"}
                                </p>
                            )}
                            <div className="grid gap-4">
                                <TokenInput
                                    label="USDT Amount"
                                    value={bnbUSDT}
                                    setValue={setBnbUSDT}
                                />
                                <TokenInput
                                    label="USDC Amount"
                                    value={bnbUSDC}
                                    setValue={setBnbUSDC}
                                />
                                <TokenInput
                                    label="ETH Amount"
                                    value={bnbETH}
                                    setValue={setBnbETH}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                    <div className="flex justify-around items-center mt-8">
                        <Button
                            variant="ghost"
                            className="quantum-card glow flex items-center gap-2"
                            onClick={handleFetchBalances}
                        >
                            <Eye className="h-5 w-5" />
                            Preview Balances
                        </Button>
                        <Button
                            variant="ghost"
                            className="quantum-card glow flex items-center gap-2"
                            onClick={fetchPriceFeeds}
                        >
                            <Eye className="h-5 w-5" />
                            Fetch Price Feeds
                        </Button>
                        <Button
                            className="quantum-card glow flex items-center gap-2"
                            onClick={handleExecute}
                        >
                            Execute
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                </Card>
                {priceFeedLog && (
                    <Card className="mt-4 p-4">
                        <p className="text-sm text-gray-200">{priceFeedLog}</p>
                    </Card>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------
// Reusable components for Wallet & Token inputs

function WalletInput({
                         placeholder,
                         value,
                         onChange,
                     }: {
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
}) {
    return (
        <div className="flex items-center gap-4 mb-6">
            <Wallet className="h-6 w-6 text-blue-400" />
            <Input
                type="text"
                placeholder={placeholder}
                className="quantum-card text-lg font-mono"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function TokenInput({
                        label,
                        value,
                        setValue,
                    }: {
    label: string;
    value: string;
    setValue: (val: string) => void;
}) {
    return (
        <div className="flex items-center gap-4">
            <Input
                type="number"
                placeholder={label}
                className="quantum-card text-lg"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <Percent className="h-6 w-6 text-blue-400" />
        </div>
    );
}