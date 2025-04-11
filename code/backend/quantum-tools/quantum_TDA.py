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

# Qiskit imports for quantum kernel construction.
from qiskit_machine_learning.kernels import QuantumKernel
from qiskit.circuit.library import ZZFeatureMap
from qiskit import BasicAer

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
        # Random cluster center in the feature space.
        cluster_center = np.random.rand(num_features) * 100
        # Generate points around the cluster center.
        cluster_data = cluster_center + np.random.randn(samples_per_cluster, num_features) * 5
        data.append(cluster_data)
    return np.vstack(data)

# -----------------------------------------------------------------------------
# Quantum Kernel Computation Using Qiskit
# -----------------------------------------------------------------------------
def compute_quantum_kernel_matrix(data: np.ndarray) -> np.ndarray:
    """
    Uses Qiskit's QuantumKernel with a ZZFeatureMap to compute the kernel (similarity)
    matrix between data points. In the quantum feature space, the kernel captures the inner
    products between the quantum states encoding the classical data.
    
    Args:
        data: The input data as a numpy array of shape (num_samples, num_features)
    
    Returns:
        Kernel matrix as a numpy array with shape (num_samples, num_samples)
    """
    # Define a feature map to encode data into a quantum state.
    feature_map = ZZFeatureMap(feature_dimension=data.shape[1], reps=2, entanglement='linear')
    quantum_instance = BasicAer.get_backend('statevector_simulator')
    quantum_kernel = QuantumKernel(feature_map=feature_map, quantum_instance=quantum_instance)

    # Evaluate the kernel matrix for all data points.
    kernel_matrix = quantum_kernel.evaluate(x_vec=data)
    return kernel_matrix

# -----------------------------------------------------------------------------
# Convert Kernel Matrix to Distance Matrix
# -----------------------------------------------------------------------------
def kernel_to_distance(kernel_matrix: np.ndarray) -> np.ndarray:
    """
    Converts a kernel (similarity) matrix to a distance matrix.
    A common choice is:
    
         d(x, y) = sqrt( k(x,x) + k(y,y) - 2 * k(x,y) )
    
    This transformation ensures that a high similarity (large kernel value)
    corresponds to a smaller distance.
    
    Args:
        kernel_matrix: A symmetric matrix of kernel values.
        
    Returns:
        Distance matrix of the same shape.
    """
    diag = np.diag(kernel_matrix)
    # Broadcasting to compute pairwise distances.
    distance_matrix = np.sqrt(np.abs(diag[:, None] + diag[None, :] - 2 * kernel_matrix))
    return distance_matrix

# -----------------------------------------------------------------------------
# Compute Persistent Homology via Ripser
# -----------------------------------------------------------------------------
def compute_persistence(distance_matrix: np.ndarray):
    """
    Computes the persistent homology of a dataset given a pairwise distance matrix using ripser.
    The resulting persistence diagrams capture the birth and death of topological features (e.g.,
    connected components, loops).
    
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
    # Step 1: Generate or load high-dimensional financial data.
    data = generate_synthetic_financial_data(num_samples=150, num_features=10)
    print("Data shape:", data.shape)

    # Step 2: Compute the quantum kernel matrix using Qiskit.
    kernel_matrix = compute_quantum_kernel_matrix(data)
    print("Kernel matrix shape:", kernel_matrix.shape)

    # Step 3: Transform the kernel matrix to a distance matrix.
    distance_matrix = kernel_to_distance(kernel_matrix)

    # Step 4: Compute persistent homology (topological features) of the data.
    diagrams = compute_persistence(distance_matrix)

    # Step 5: Visualize the persistence diagrams.
    plot_diagrams(diagrams, show=True)
    plt.title("Persistence Diagrams from Quantum TDA")
    plt.show()

if __name__ == "__main__":
    main()
