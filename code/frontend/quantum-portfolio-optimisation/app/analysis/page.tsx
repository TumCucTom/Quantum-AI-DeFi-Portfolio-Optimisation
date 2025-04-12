"use client";
import React, { useEffect, useState } from 'react';
import SectionNav from './sectionBar';
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
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);
import axios from 'axios';

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
        const res = await axios.get('http://127.0.0.1:8000/tokens/supply');
        setTokens(res.data);
        setError(null);
      } catch (err) {
        setError('⚠️ 데이터를 불러오는 중 오류가 발생했습니다.');
        setTokens({});
        console.error('❌ API 오류:', err);
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
  }, []);
  
  // Common responsive margins
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
      const response = await fetch('http://localhost:5002/api/quantum_mc', {
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

    try {
      const response = await fetch('http://localhost:5002/api/quantum_mc', {
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
      const response = await fetch('http://localhost:5002/api/quantum_tda', {
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
    setTdaUsePauli(false);

    try {
      const response = await fetch('http://localhost:5002/api/quantum_tda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_type: "loop", use_pauli: false })
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
    if (!mcData) return null;

    // Extract classical and quantum simulation data from API result
    const classicalSim = mcData.classical_rng_simulation;
    const quantumSim = mcData.quantum_rng_simulation;

    // Create a line chart with a few classical sample paths
    const classicalLineData = {
      labels: classicalSim.time_grid,
      datasets: classicalSim.sample_paths.slice(0, 5).map((path: number[], index: number) => ({
        label: `Path ${index + 1}`,
        data: path,
        fill: false,
        borderWidth: 1,
      }))
    };

    // Create a bar chart comparing the estimated prices from classical and quantum runs
    const comparisonData = {
      labels: ['Classical', 'Quantum'],
      datasets: [{
        label: 'Estimated Price',
        data: [classicalSim.estimated_price, quantumSim.estimated_price],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
      }]
    };

    return (
        <div>
          <h3>Monte Carlo Simulation Charts</h3>
          <div style={{ marginBottom: '2rem' }}>
            <h4>Classical Sample Paths</h4>
            <Line data={classicalLineData} />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <h4>Estimated Price Comparison</h4>
            <Bar data={comparisonData} />
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
          {quantumPD && quantumPD.map((pd: number[][], index: number) => (
              <div key={index}>
                {renderPersistence(pd, `H${index}`)}
              </div>
          ))}
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

          {/* Live Data Section (Placeholder) */}
          <h2 id="livedata" className="scroll-target" style={{ ...styles.heading, ...getResponsiveMargins() }}>
            Live Data
          </h2>
          <div style={{ ...styles.graphArea, ...getResponsiveMargins() }}>
            {/* Example: You might include a live updating table or chart here */}
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