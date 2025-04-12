import numpy as np
from ripser import ripser
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.datasets import make_circles, make_swiss_roll

# Qiskit Imports
from qiskit.primitives import Sampler
from qiskit_algorithms.state_fidelities import ComputeUncompute
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit.circuit.library import ZZFeatureMap, PauliFeatureMap

import pandas as pd

# ------------------------------
# Data Generation Functions
# ------------------------------
def generate_synthetic_clusters(num_samples=150, num_features=10):
    np.random.seed(42)
    samples_per_cluster = num_samples // 3
    data = []
    for _ in range(3):
        cluster_center = np.random.rand(num_features) * 300
        cluster_data = cluster_center + np.random.randn(samples_per_cluster, num_features) * 1.5
        data.append(cluster_data)
    return np.vstack(data)

def generate_loop_data(n_points=100, noise=0.05):
    t = np.linspace(0, 2 * np.pi, n_points)
    x = np.cos(t) + noise * np.random.randn(n_points)
    y = np.sin(t) + noise * np.random.randn(n_points)
    return np.stack([x, y], axis=1)

def generate_swiss_roll(n_points=200, noise=0.1):
    data, _ = make_swiss_roll(n_samples=n_points, noise=noise)
    return data

# ------------------------------
# Quantum Kernel Computations
# ------------------------------
def compute_quantum_kernel_matrix(data: np.ndarray, use_pauli: bool = False) -> np.ndarray:
    """
    Build a quantum kernel using either PauliFeatureMap or ZZFeatureMap,
    and evaluate the kernel matrix for the input data.
    """
    if use_pauli:
        feature_map = PauliFeatureMap(feature_dimension=data.shape[1], reps=3, entanglement='full')
    else:
        feature_map = ZZFeatureMap(feature_dimension=data.shape[1], reps=10, entanglement='full')

    sampler = Sampler()
    fidelity = ComputeUncompute(sampler=sampler)
    quantum_kernel = FidelityQuantumKernel(feature_map=feature_map, fidelity=fidelity)
    return quantum_kernel.evaluate(x_vec=data)

def kernel_to_distance(kernel_matrix: np.ndarray) -> np.ndarray:
    """
    Convert a kernel matrix to a distance matrix using the formula:
       d(i,j) = sqrt( K(i,i) + K(j,j) - 2*K(i,j) )
    """
    diag = np.diag(kernel_matrix)
    return np.sqrt(np.abs(diag[:, None] + diag[None, :] - 2 * kernel_matrix))

def compute_persistence(distance_matrix: np.ndarray):
    """
    Compute persistent homology of a distance matrix using ripser.
    Returns the persistence diagrams.
    """
    return ripser(distance_matrix, distance_matrix=True)['dgms']

# ------------------------------
# API Endpoint Function
# ------------------------------
def quantum_tda_endpoint(input_data: dict = None) -> dict:
    """
    API endpoint function for Quantum Topological Data Analysis.

    If input_data is None, default parameters are used.

    Expected keys in input_data (all optional):
      - data_type: one of "synthetic_clusters", "loop", "swiss_roll", "csv"
      - num_samples: (for synthetic_clusters) default 100
      - num_features: (for synthetic_clusters) default 4
      - n_points: (for loop data) default 100
      - noise: noise level for loop data, default 0.05
      - swiss_roll_n_points: (for swiss_roll) default 150
      - swiss_roll_noise: default 0.1
      - use_pauli: boolean for quantum kernel feature map. Default False.
      - gamma: gamma parameter for RBF kernel (classical). Default 0.001.
      - csv_path: if data_type is "csv", provide a path to a CSV file.

    Returns a JSON–friendly dictionary with:
      - "data_type": the type of data used
      - "input_data": the raw data used (as list of lists)
      - "quantum_kernel_matrix": 2D list representation of the quantum kernel matrix
      - "classical_kernel_matrix": 2D list representation of the classical RBF kernel matrix
      - "quantum_distance_matrix": 2D list of the distance matrix derived from the quantum kernel
      - "classical_distance_matrix": 2D list of the distance matrix derived from the classical kernel
      - "quantum_persistence_diagrams": list (per homology dimension) of persistence points [[birth, death], ...]
      - "classical_persistence_diagrams": list (per homology dimension) of persistence points
    """
    # Default parameters
    defaults = {
        "data_type": "synthetic_clusters",  # alternatives: "loop", "swiss_roll", "csv"
        "num_samples": 100,
        "num_features": 4,
        "n_points": 100,
        "noise": 0.05,
        "swiss_roll_n_points": 150,
        "swiss_roll_noise": 0.1,
        "use_pauli": False,
        "gamma": 0.001,
        "csv_path": None
    }
    # Override defaults with input_data if provided
    if input_data is not None:
        params = {**defaults, **input_data}
    else:
        params = defaults

    # ------------------------------
    # Data Selection and Generation
    # ------------------------------
    data_type = params["data_type"]
    if data_type in ["synthetic_clusters", "1"]:
        data = generate_synthetic_clusters(num_samples=params["num_samples"], num_features=params["num_features"])
        data_type_used = "synthetic_clusters"
    elif data_type in ["loop", "2"]:
        data = generate_loop_data(n_points=params["n_points"], noise=params["noise"])
        data_type_used = "loop"
    elif data_type in ["swiss_roll", "3"]:
        data = generate_swiss_roll(n_points=params["swiss_roll_n_points"], noise=params["swiss_roll_noise"])
        data_type_used = "swiss_roll"
    elif data_type in ["csv", "4"]:
        if params.get("csv_path", None) is None:
            return {"error": "csv_path not provided"}
        df = pd.read_csv(params["csv_path"])
        data = df.values
        data_type_used = "csv"
    else:
        return {"error": "Invalid data_type provided."}

    # ------------------------------
    # Kernel Computations
    # ------------------------------
    # Quantum Kernel
    q_kernel = compute_quantum_kernel_matrix(data, use_pauli=params["use_pauli"])
    # Classical Kernel (RBF)
    c_kernel = rbf_kernel(data, gamma=params["gamma"])

    # ------------------------------
    # Distance Matrices and Persistence Diagrams
    # ------------------------------
    q_dist = kernel_to_distance(q_kernel)
    c_dist = kernel_to_distance(c_kernel)

    q_persistence = compute_persistence(q_dist)
    c_persistence = compute_persistence(c_dist)

    # ------------------------------
    # Assemble output into a JSON–friendly dictionary.
    # ------------------------------
    output = {
        "data_type": data_type_used,
        "input_data": data.tolist(),
        "quantum_kernel_matrix": q_kernel.tolist(),
        "classical_kernel_matrix": c_kernel.tolist(),
        "quantum_distance_matrix": q_dist.tolist(),
        "classical_distance_matrix": c_dist.tolist(),
        "quantum_persistence_diagrams": [dgm.tolist() for dgm in q_persistence],
        "classical_persistence_diagrams": [dgm.tolist() for dgm in c_persistence]
    }
    return output

# ------------------------------
# Example usage: Running the endpoint directly
# ------------------------------
if __name__ == "__main__":
    # Here you can call the endpoint with default parameters.
    result_json = quantum_tda_endpoint()

    # For demonstration, pretty-print the JSON output.
    import json
    print(json.dumps(result_json, indent=2))
