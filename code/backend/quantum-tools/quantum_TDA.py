import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from ripser import ripser
from persim import plot_diagrams
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.datasets import make_circles, make_swiss_roll

from qiskit.primitives import Sampler
from qiskit_algorithms.state_fidelities import ComputeUncompute
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit.circuit.library import ZZFeatureMap, PauliFeatureMap


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


def compute_quantum_kernel_matrix(data: np.ndarray, use_pauli: bool = False) -> np.ndarray:
    if use_pauli:
        feature_map = PauliFeatureMap(feature_dimension=data.shape[1], reps=3, entanglement='full')
    else:
        feature_map = ZZFeatureMap(feature_dimension=data.shape[1], reps=10, entanglement='full')

    sampler = Sampler()
    fidelity = ComputeUncompute(sampler=sampler)
    quantum_kernel = FidelityQuantumKernel(feature_map=feature_map, fidelity=fidelity)
    return quantum_kernel.evaluate(x_vec=data)


def kernel_to_distance(kernel_matrix: np.ndarray) -> np.ndarray:
    diag = np.diag(kernel_matrix)
    return np.sqrt(np.abs(diag[:, None] + diag[None, :] - 2 * kernel_matrix))


def compute_persistence(distance_matrix: np.ndarray):
    return ripser(distance_matrix, distance_matrix=True)['dgms']


def plot_all(data, q_kernel, c_kernel):
    q_dist = kernel_to_distance(q_kernel)
    c_dist = kernel_to_distance(c_kernel)

    q_diagrams = compute_persistence(q_dist)
    c_diagrams = compute_persistence(c_dist)

    fig, axs = plt.subplots(1, 2, figsize=(14, 6))
    plot_diagrams(q_diagrams, ax=axs[0], show=False)
    axs[0].set_title("Quantum Kernel Persistence")

    plot_diagrams(c_diagrams, ax=axs[1], show=False)
    axs[1].set_title("Classical RBF Kernel Persistence")
    plt.show()

    sns.heatmap(q_kernel, cmap="viridis")
    plt.title("Quantum Kernel Matrix")
    plt.show()

    sns.heatmap(c_kernel, cmap="viridis")
    plt.title("Classical RBF Kernel Matrix")
    plt.show()


def main():
    print("Select data type:")
    print("1 - Synthetic Gaussian clusters")
    print("2 - Loop structure")
    print("3 - Swiss roll")
    print("4 - Load real data from CSV")
    choice = input("Enter 1/2/3/4: ")

    if choice == '1':
        data = generate_synthetic_clusters(num_samples=100, num_features=4)
    elif choice == '2':
        data = generate_loop_data(n_points=100, noise=0.05)
    elif choice == '3':
        data = generate_swiss_roll(n_points=150, noise=0.1)
    elif choice == '4':
        import pandas as pd
        file_path = input("Enter path to CSV: ")
        df = pd.read_csv(file_path)
        data = df.values
        print("Loaded data with shape:", data.shape)
    else:
        print("Invalid choice. Exiting.")
        return

    print("Use PauliFeatureMap instead of ZZFeatureMap? (y/n):")
    use_pauli = input().strip().lower() == 'y'

    print("Computing Quantum Kernel...")
    q_kernel = compute_quantum_kernel_matrix(data, use_pauli=use_pauli)

    print("Computing Classical RBF Kernel...")
    c_kernel = rbf_kernel(data, gamma=0.001)

    print("Plotting persistence diagrams and kernels...")
    plot_all(data, q_kernel, c_kernel)


if __name__ == "__main__":
    main()