"""
Quantum Topological Data Analysis (TDA)
Use case: Extracting structure from high-dimensional financial data (e.g., asset manifolds, regime detection)

Quantum angle:
- Uses a quantum kernel (via Qiskit) to encode data into a quantum feature space.
- Computes a similarity (kernel) matrix from the quantum feature map.
- Converts the kernel matrix to a distance matrix.
- Applies classical persistent homology (via ripser) to extract topological features.
- The persistence diagrams provide insights into the underlying structure of the data,
  which can be used for dimensionality reduction or market behavior analysis.
"""

import numpy as np
import matplotlib.pyplot as plt
from ripser import ripser
from persim import plot_diagrams

from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit.circuit.library import ZZFeatureMap
from qiskit_algorithms.state_fidelities import ComputeUncompute


# -----------------------------------------------------------------------------
# Synthetic Data Generation
# -----------------------------------------------------------------------------
def generate_synthetic_financial_data(num_samples: int = 150, num_features: int = 10) -> np.ndarray:
    """
    Simulates high-dimensional financial data that might reflect asset returns or market regimes.
    For demonstration, we create a mixture of three Gaussian clusters.

    Args:
        num_samples: Total number of data points.
        num_features: Dimensionality of each data point.

    Returns:
        A numpy array of shape (num_samples, num_features)
    """
    np.random.seed(42)
    samples_per_cluster = num_samples // 3
    data = []
    for _ in range(3):
        cluster_center = np.random.rand(num_features) * 100
        cluster_data = cluster_center + np.random.randn(samples_per_cluster, num_features) * 5
        data.append(cluster_data)
    return np.vstack(data)

# -----------------------------------------------------------------------------
# Quantum Kernel Computation Using Qiskit
# -----------------------------------------------------------------------------
def compute_quantum_kernel_matrix(data: np.ndarray) -> np.ndarray:
    """
    Uses Qiskit's FidelityQuantumKernel with a ZZFeatureMap and ComputeUncompute fidelity
    to compute the quantum kernel matrix.
    """
    feature_map = ZZFeatureMap(feature_dimension=data.shape[1], reps=2, entanglement='linear')
    fidelity = ComputeUncompute()
    quantum_kernel = FidelityQuantumKernel(feature_map=feature_map, fidelity=fidelity)

    kernel_matrix = quantum_kernel.evaluate(x_vec=data)
    return kernel_matrix


# -----------------------------------------------------------------------------
# Convert Kernel Matrix to Distance Matrix
# -----------------------------------------------------------------------------
def kernel_to_distance(kernel_matrix: np.ndarray) -> np.ndarray:
    """
    Converts a kernel (similarity) matrix to a distance matrix using:
        d(x, y) = sqrt( k(x,x) + k(y,y) - 2 * k(x,y) )

    Args:
        kernel_matrix: A symmetric matrix of kernel values.

    Returns:
        Distance matrix of the same shape.
    """
    diag = np.diag(kernel_matrix)
    distance_matrix = np.sqrt(np.abs(diag[:, None] + diag[None, :] - 2 * kernel_matrix))
    return distance_matrix

# -----------------------------------------------------------------------------
# Compute Persistent Homology via Ripser
# -----------------------------------------------------------------------------
def compute_persistence(distance_matrix: np.ndarray):
    """
    Computes persistent homology using ripser from a pairwise distance matrix.

    Args:
        distance_matrix: A numpy array representing the pairwise distances.

    Returns:
        A list of persistence diagrams.
    """
    diagrams = ripser(distance_matrix, distance_matrix=True)['dgms']
    return diagrams

# -----------------------------------------------------------------------------
# Main Pipeline Execution
# -----------------------------------------------------------------------------
def main():
    data = generate_synthetic_financial_data(num_samples=150, num_features=10)
    print("Data shape:", data.shape)

    kernel_matrix = compute_quantum_kernel_matrix(data)
    print("Kernel matrix shape:", kernel_matrix.shape)

    distance_matrix = kernel_to_distance(kernel_matrix)
    diagrams = compute_persistence(distance_matrix)

    plot_diagrams(diagrams, show=True)
    plt.title("Persistence Diagrams from Quantum TDA")
    plt.show()

if __name__ == "__main__":
    main()
