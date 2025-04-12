"use client";
import React, { useEffect, useState } from 'react';
import SectionNav from './sectionBar';
// import TransferTable from '@/components/TransferTable';

const FullGraphs: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  // State for Monte Carlo simulation controls
  const [useQuantumRNG, setUseQuantumRNG] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useUploaded, setUseUploaded] = useState(false);
  const [simQubits, setSimQubits] = useState(3);
  const [maxEvalQubits, setMaxEvalQubits] = useState(6);
  const [normalise, setNormalise] = useState(false);

  // State for TDA controls
  const [tdaFile, setTdaFile] = useState<File | null>(null);
  const [tdaMethod, setTdaMethod] = useState<string>("loop");
  const [tdaUsePauli, setTdaUsePauli] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Common margin function
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

  // Handler for run simulation button (Monte Carlo)
  const handleRunSimulation = () => {
    console.log("Run simulation clicked", {
      useQuantumRNG,
      uploadedFile,
      useUploaded,
      simQubits,
      maxEvalQubits,
      normalise,
    });
  };

  // Handler for run TDA analysis button
  const handleRunTda = () => {
    console.log("Run TDA Analysis clicked", {
      tdaFile,
      tdaMethod,
      tdaUsePauli,
    });
  };

  return (
      <>
        <SectionNav />

        <div style={styles.container}>
          {/* Monte Carlo Section */}
          <h2
              id="montecarlo"
              className="scroll-target"
              style={{...styles.heading, ...getResponsiveMargins()}}
          >
            Quantum Monte Carlo Simulations
          </h2>
          <div style={{...styles.graphArea, ...getResponsiveMargins()}}>
            {/* Monte Carlo Controls Section */}
            <div style={styles.controlsContainer}>
              <button style={styles.runButton} onClick={handleRunSimulation}>
                Run Simulation
              </button>
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>Upload CSV File:</label>
                <input type="file" accept=".csv" onChange={handleFileChange}/>
              </div>

              {/* Use Uploaded Data Toggle */}
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

              {/* Normalise Toggle */}
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>Normalise:</label>
                <span style={styles.toggleLabel}>Off</span>
                <label className="switch">
                  <input
                      type="checkbox"
                      checked={normalise}
                      onChange={(e) => setNormalise(e.target.checked)}
                  />
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

            {/* Monte Carlo Graphs Section */}
            <div style={styles.graphsContainer}>
              <div style={styles.singleGraph}>Classical</div>
              <div style={styles.singleGraph}>Quantum</div>
              <div style={styles.singleGraph}>Quantum v Classical Bit Comparison</div>
            </div>

            {/* Monte Carlo Link Section */}
            <div style={styles.linkContainer}>
              <a href="/snippets" style={styles.snippetLink}>
                See the code explained with |Jesko|^2
              </a>
            </div>
          </div>

          {/* TDA Section */}
          <h2
              id="tda"
              className="scroll-target"
              style={{...styles.heading, ...getResponsiveMargins()}}
          >
            Quantum Topological Data Analysis (TDA)
          </h2>
          <div style={{...styles.graphArea, ...getResponsiveMargins()}}>
            {/* TDA Controls */}
            <div style={styles.controlsContainer}>
              {/* Run TDA Analysis Button */}
              <button style={styles.runButton} onClick={handleRunTda}>
                Run TDA Analysis
              </button>
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>Upload CSV File:</label>
                <input type="file" accept=".csv" onChange={handleTdaFileChange}/>
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
                  <option value="uploaded" disabled={!tdaFile}>
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
                <div style={styles.singleGraph}>Graph 1</div>
                <div style={styles.singleGraph}>Graph 2</div>
                <div style={styles.singleGraph}>Graph 3</div>
                <div style={styles.singleGraph}>Graph 4</div>
              </div>
            </div>
            <div style={styles.linkContainer}>
              <a href="/snippets" style={styles.snippetLink}>
                See the code explained with |Jesko|^2
              </a>
            </div>
          </div>

          {/* Live Data Section */}
          <h2
              id="livedata"
              className="scroll-target"
              style={{...styles.heading, ...getResponsiveMargins()}}
          >
            Live Data
          </h2>
          <div style={{...styles.graphArea, ...getResponsiveMargins()}}>
            {/* <TransferTable /> */}
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
  // New styles for TDA carousel
  carouselContainer: {
    overflowX: 'auto',
    padding: '1rem 0',
  },
  carouselTrack: {
    display: 'flex',
    gap: '1rem',
  },
};
