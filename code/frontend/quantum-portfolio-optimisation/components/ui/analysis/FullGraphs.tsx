"use client";
import React, { useEffect, useState } from 'react';
import SectionNav from '../../../app/analysis/sectionBar';
// Import chart components and necessary parts of chart.js
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

useEffect(() => {
    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

}, []);
import axios from 'axios';
import MiniChart from "../../../app/analysis/MiniChart";
import HeatmapComponent from "@/components/ui/analysis/heatmap";


interface TokenInfo {
    name: string;
    symbol: string;
    decimals: string;
    totalSupply: string;
}

type TokenMap = Record<string, TokenInfo>;


const FullGraphs: React.FC = () => {
    // Responsive layout state
    const [isMobile, setIsMobile] = useState(false);
    const [tokens, setTokens] = useState<TokenMap>({});
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [lastSupply, setLastSupply] = useState<Record<string, number>>({});


    // Monte Carlo Simulation state
    const [useQuantumRNG, setUseQuantumRNG] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [useUploaded, setUseUploaded] = useState(false);
    const [simQubits, setSimQubits] = useState(3);
    const [maxEvalQubits, setMaxEvalQubits] = useState(6);
    const [normalise, setNormalise] = useState(false);

    // TDA Analysis state
    const [tdaFile, setTdaFile] = useState<File | null>(null);
    const [tdaMethod, setTdaMethod] = useState<string>("loop");
    const [tdaUsePauli, setTdaUsePauli] = useState(false);

    // State for API results
    const [mcData, setMcData] = useState<any>(null);
    const [tdaData, setTdaData] = useState<any>(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();

        const fetchTokens = async () => {
            try {
                const res = await axios.get<Record<string, TokenInfo>>("http://127.0.0.1:8000/tokens/supply");
                setTokens(res.data);
                setError(null);
                const timestamp = new Date().toLocaleTimeString();
                const newDataPoint: Record<string, any> = { time: timestamp };

                for (const [symbol, token] of Object.entries(res.data)) {
                    const current = Number(token.totalSupply ?? "0");

                    const prev =
                        chartData.length > 0 && chartData[chartData.length - 1][symbol + "_raw"]
                            ? chartData[chartData.length - 1][symbol + "_raw"]
                            : current;

                    const change = prev !== 0 ? ((current - prev) / prev) * 100 : 0;

                    newDataPoint[symbol] = parseFloat(change.toFixed(4));
                    newDataPoint[symbol + "_raw"] = current;
                }

                setChartData((prev) => [...prev.slice(-9), newDataPoint]);

            } catch (err) {
                setError("⚠️ 데이터를 불러오는 중 오류가 발생했습니다.");
                setTokens({});
                console.error("❌ API 오류:", err);
            }
        };

        fetchTokens();
        const interval = setInterval(fetchTokens, 5000);
        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", handleResize);
        };
    }, [lastSupply]);


    const getResponsiveMargins = (): React.CSSProperties =>
        isMobile ? { margin: '0 1rem' } : {};

    // Monte Carlo file handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploadedFile(e.target.files[0]);
        } else {
            setUploadedFile(null);
        }
    };

    // TDA file handler
    const handleTdaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setTdaFile(e.target.files[0]);
        } else {
            setTdaFile(null);
        }
    };

    // Run Monte Carlo simulation with custom parameters
    const handleRunSimulation = async () => {
        // Prepare payload with your simulation parameters.
        const payload = {
            useQuantumRNG,
            simQubits,
            maxEvalQubits,
            normalise
        };

        try {
            const response = await fetch('http://127.0.0.1:5002/api/quantum_mc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            console.log("Simulation data:", data);
            setMcData(data);
        } catch (error) {
            console.error("Error running simulation:", error);
        }
    };

    // Run simulation with default settings (using GET for simplicity)
    const handleRunDefaultSimulation = async () => {
        // Reset state to defaults
        setUseQuantumRNG(false);
        setUploadedFile(null);
        setUseUploaded(false);
        setSimQubits(3);
        setMaxEvalQubits(6);
        setNormalise(false);
        console.log("defaults");

        try {
            const response = await fetch('http://127.0.0.1:5002/api/quantum_mc', {
                method: 'GET'
            });
            const data = await response.json();
            console.log("Default simulation data:", data);
            setMcData(data);
        } catch (error) {
            console.error("Error running default simulation:", error);
        }
    };

    // Run TDA analysis with custom parameters
    const handleRunTda = async () => {
        // Build payload; if a CSV file is uploaded you might need to process it.
        let payload: any = {
            data_type: tdaMethod,
            use_pauli: tdaUsePauli
        };

        if (tdaFile) {
            // In a real app you’d use FileReader to get CSV content.
            payload.data_type = "csv";
        }

        try {
            const response = await fetch('http://127.0.0.1:5002/api/quantum_tda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            console.log("TDA data:", data);
            setTdaData(data);
        } catch (error) {
            console.error("Error running TDA analysis:", error);
        }
    };

    // Run TDA with default settings
    const handleRunDefaultTda = async () => {
        setTdaFile(null);
        setTdaMethod("loop");
        setTdaUsePauli(true);

        try {
            const response = await fetch('http://127.0.0.1:5002/api/quantum_tda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data_identifier: "loop", use_pauli: true })
            });
            const data = await response.json();
            console.log("Default TDA data:", data);
            setTdaData(data);
        } catch (error) {
            console.error("Error running default TDA analysis:", error);
        }
    };

    // Render Monte Carlo charts if data is available
    const renderMonteCarloCharts = () => {
        if (!mcData || !mcData.classical_rng_simulation || !mcData.quantum_rng_simulation) return null;

        const classicalSim = mcData.classical_rng_simulation;
        const quantumSim = mcData.quantum_rng_simulation;

        if (!classicalSim.time_grid || !classicalSim.sample_paths || !quantumSim.sample_paths) return null;

        const getColor = (i: number) => {
            const colors = [
                '#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d',
                '#43aa8b', '#577590', '#277da1', '#9c89b8', '#ff70a6',
                '#70d6ff', '#ffd670', '#ff9770', '#e9ff70', '#b5ead7',
                '#00f5d4', '#00bbf9', '#ff006e', '#8338ec', '#3a86ff'
            ];
            return colors[i % colors.length];
        };

        const createLineData = (paths: number[][], labelPrefix: string) => ({
            labels: classicalSim.time_grid,
            datasets: paths.slice(0, 20).map((path: number[], index: number) => ({
                label: `${labelPrefix} ${index + 1}`,
                data: path,
                borderColor: getColor(index),
                backgroundColor: getColor(index),
                fill: false,
                borderWidth: 1.5,
                pointRadius: 0
            }))
        });

        const lineOptions = {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'white' },
                    grid: { color: 'white' }
                },
                y: {
                    ticks: { color: 'white' },
                    grid: { color: 'white' }
                }
            }
        };

        const comparisonData = {
            labels: ['Classical', 'Quantum'],
            datasets: [{
                label: 'Estimated Price',
                data: [classicalSim.estimated_price ?? 0, quantumSim.estimated_price ?? 0],
                backgroundColor: ['#4fd1c5', '#b794f4']
            }]
        };

        const comparisonOptions = {
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'white' },
                    grid: { color: 'white' }
                },
                y: {
                    ticks: { color: 'white' },
                    grid: { color: 'white' }
                }
            }
        };

        return (
            <div>
                <h3>Monte Carlo Simulation Charts</h3>

                {/* Classical RNG Chart */}
                <div style={{ marginBottom: '2rem' }}>
                    <h4>Classical Sample Paths</h4>
                    <Line data={createLineData(classicalSim.sample_paths, "Classical Path")} options={lineOptions} />
                </div>

                {/* Quantum RNG Chart */}
                <div style={{ marginBottom: '2rem' }}>
                    <h4>Quantum Sample Paths</h4>
                    <Line data={createLineData(quantumSim.sample_paths, "Quantum Path")} options={lineOptions} />
                </div>

                {/* Estimated price comparison */}
                <div style={{ marginBottom: '2rem' }}>
                    <h4>Estimated Price Comparison</h4>
                    <Bar data={comparisonData} options={comparisonOptions} />
                </div>
            </div>
        );
    };


    // Render TDA charts if data is available
    const renderTdaCharts = () => {
        if (!tdaData) return null;

        // Use the quantum persistence diagrams (an array for each homology dimension)
        const quantumPD = tdaData.quantum_persistence_diagrams;

        const renderPersistence = (pd: number[][], homology: string) => {
            const scatterData = {
                datasets: [{
                    label: `Persistence Diagram ${homology}`,
                    data: pd.map(([birth, death]) => ({ x: birth, y: death })),
                    pointRadius: 5
                }]
            };
            const options = {
                scales: {
                    x: { title: { display: true, text: 'Birth' } },
                    y: { title: { display: true, text: 'Death' } }
                }
            };
            return (
                <div style={{ marginBottom: '2rem' }}>
                    <h4>{homology} Persistence Diagram</h4>
                    <Scatter data={scatterData} options={options} />
                </div>
            );
        };

        return (
            <div>
                <h3>Quantum TDA Charts</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ width: '25%' }}>
                        <HeatmapComponent data={tdaData.quantum_kernel_matrix} title="Quantum Kernel Matrix" />
                    </div>
                    <div style={{ width: '25%' }}>
                        <HeatmapComponent data={tdaData.classical_kernel_matrix} title="Classical Kernel Matrix" />
                    </div>
                    <div style={{ width: '25%' }}>
                        <HeatmapComponent data={tdaData.quantum_distance_matrix} title="Quantum Distance Matrix" />
                    </div>
                    <div style={{ width: '25%' }}>
                        <HeatmapComponent data={tdaData.classical_distance_matrix} title="Classical Distance Matrix" />
                    </div>

                    {quantumPD && quantumPD.map((pd: number[][], index: number) => (
                        <div key={index} style={{ width: '50%' }}>
                            {renderPersistence(pd, `H${index}`)}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <SectionNav />
            <div style={styles.container}>
                {/* Monte Carlo Simulation Section */}
                <h2 id="montecarlo" className="scroll-target" style={{ ...styles.heading, ...getResponsiveMargins() }}>
                    Quantum Monte Carlo Simulations
                </h2>
                <div style={{ ...styles.graphArea, ...getResponsiveMargins() }}>
                    {/* Controls for Monte Carlo */}
                    <div style={styles.controlsContainer}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button style={styles.defaultButton} onClick={handleRunDefaultSimulation}>
                                Defaults & Run
                            </button>
                            <button style={styles.runButton} onClick={handleRunSimulation}>
                                Run Simulation
                            </button>
                        </div>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Upload CSV File:</label>
                            <input type="file" accept=".csv" onChange={handleFileChange} />
                        </div>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Use Data:</label>
                            <span style={styles.toggleLabel}>Mock</span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={useUploaded}
                                    onChange={(e) => setUseUploaded(e.target.checked)}
                                    disabled={!uploadedFile}
                                />
                                <span className="slider round"></span>
                            </label>
                            <span style={styles.toggleLabel}>Uploaded</span>
                        </div>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Normalise:</label>
                            <span style={styles.toggleLabel}>Off</span>
                            <label className="switch">
                                <input type="checkbox" checked={normalise} onChange={(e) => setNormalise(e.target.checked)} />
                                <span className="slider round"></span>
                            </label>
                            <span style={styles.toggleLabel}>On</span>
                        </div>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Simulation Qubits:</label>
                            <input
                                className="text-black text-right"
                                type="number"
                                placeholder="3"
                                value={simQubits}
                                onChange={(e) => setSimQubits(Number(e.target.value))}
                                min={1}
                                max={8}
                            />
                        </div>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Max Eval Qubits:</label>
                            <input
                                className="text-black text-right"
                                type="number"
                                placeholder="6"
                                value={maxEvalQubits}
                                onChange={(e) => setMaxEvalQubits(Number(e.target.value))}
                                min={1}
                                max={8}
                            />
                        </div>
                    </div>

                    {/* Monte Carlo Graphs */}
                    <div style={styles.graphsContainer}>
                        {renderMonteCarloCharts() || (
                            <>
                                <div style={styles.singleGraph}>Classical</div>
                                <div style={styles.singleGraph}>Quantum</div>
                                <div style={styles.singleGraph}>Quantum v Classical Comparison</div>
                            </>
                        )}
                    </div>
                    <div style={styles.linkContainer}>
                        <a href="/snippet" style={styles.snippetLink}>
                            See the code explained with |Jesko|^2
                        </a>
                    </div>
                </div>

                {/* TDA Section */}
                <h2 id="tda" className="scroll-target" style={{ ...styles.heading, ...getResponsiveMargins() }}>
                    Quantum Topological Data Analysis (TDA)
                </h2>
                <div style={{ ...styles.graphArea, ...getResponsiveMargins() }}>
                    <div style={styles.controlsContainer}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button style={styles.defaultButton} onClick={handleRunDefaultTda}>
                                Defaults & Run
                            </button>
                            <button style={styles.runButton} onClick={handleRunTda}>
                                Run TDA Analysis
                            </button>
                        </div>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Upload CSV File:</label>
                            <input type="file" accept=".csv" onChange={handleTdaFileChange} />
                        </div>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Data Source:</label>
                            <select
                                className="text-black"
                                value={tdaMethod}
                                onChange={(e) => setTdaMethod(e.target.value)}
                            >
                                <option value="synthetic">Synthetic Gaussian Clusters</option>
                                <option value="loop">Loop Structure</option>
                                <option value="swiss">Swiss Roll</option>
                                <option value="csv" disabled={!tdaFile}>
                                    Uploaded Data
                                </option>
                            </select>
                        </div>
                        <div style={styles.controlGroup}>
                            <label style={styles.controlLabel}>Feature Map:</label>
                            <span style={styles.toggleLabel}>ZZ</span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={tdaUsePauli}
                                    onChange={(e) => setTdaUsePauli(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                            <span style={styles.toggleLabel}>Pauli</span>
                        </div>
                    </div>

                    {/* TDA Graphs Carousel */}
                    <div style={styles.carouselContainer}>
                        <div style={styles.carouselTrack}>
                            {renderTdaCharts() || (
                                <>
                                    <div style={styles.singleGraph}>Graph 1</div>
                                    <div style={styles.singleGraph}>Graph 2</div>
                                    <div style={styles.singleGraph}>Graph 3</div>
                                    <div style={styles.singleGraph}>Graph 4</div>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={styles.linkContainer}>
                        <a href="/snippet" style={styles.snippetLink}>
                            See the code explained with |Jesko|^2
                        </a>
                    </div>
                </div>
                <h2
                    id="livedata"
                    className="scroll-target"
                    style={{ ...styles.heading, ...getResponsiveMargins() }}
                >
                    Live Data
                </h2>
                <div style={{ ...styles.graphArea, ...getResponsiveMargins() }}>
                    {error && <p className="text-red-500">{error}</p>}
                    {!error && Object.keys(tokens).length === 0 && (
                        <p>📡 Loading token info...</p>
                    )}
                    {Object.entries(tokens).map(([symbol, token]) => (
                        <div
                            key={symbol}
                            className="flex flex-col md:flex-row gap-4 mb-6 p-4 border border-white/20 rounded-xl bg-white/10"
                        >
                            {/* 왼쪽 정보 */}
                            <div className="space-y-2 md:w-1/2">
                                <p><b>Name:</b> {token.name}</p>
                                <p><b>Symbol:</b> {token.symbol}</p>
                                <p><b>Decimals:</b> {token.decimals}</p>
                                <p><b>Total Supply:</b> {BigInt(token.totalSupply ?? "0").toLocaleString()}</p>
                            </div>

                            <div className="md:w-1/2 bg-white/5 rounded-md p-2">
                                <p><b>Total supply</b></p>
                                <MiniChart token={symbol} data={chartData} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default FullGraphs;

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '3rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4rem',
    },
    heading: {
        fontSize: '1.8rem',
        fontWeight: 700,
        color: '#e2e8f0',
        marginBottom: '0.5rem',
    },
    graphArea: {
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '2rem',
        borderRadius: '16px',
        minHeight: '500px',
        color: '#f1f5f9',
        backdropFilter: 'blur(6px)',
    },
    controlsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem',
    },
    runButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#3182ce',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 600,
    },
    defaultButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#38a169',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 600,
    },
    controlGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    controlLabel: {
        fontSize: '1rem',
        color: '#e2e8f0',
        minWidth: '160px',
    },
    graphsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem',
    },
    singleGraph: {
        flex: 1,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1rem',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        minHeight: '200px',
        color: '#f1f5f9',
        textAlign: 'center',
    },
    linkContainer: {
        textAlign: 'center',
    },
    snippetLink: {
        color: '#63b3ed',
        textDecoration: 'underline',
        fontSize: '1rem',
    },
    toggleLabel: {
        color: '#cbd5e1',
        fontSize: '0.875rem',
    },
    carouselContainer: {
        overflowX: 'auto',
        padding: '1rem 0',
    },
    carouselTrack: {
        display: 'flex',
        gap: '1rem',
    },
};