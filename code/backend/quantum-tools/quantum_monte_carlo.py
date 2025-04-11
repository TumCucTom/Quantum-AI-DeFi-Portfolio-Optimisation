import numpy as np
from qiskit import QuantumCircuit, Aer, transpile
from qiskit.algorithms import IterativeAmplitudeEstimation, EstimationProblem
from qiskit.primitives import Sampler
from qiskit.circuit.library import NormalDistribution

# === Classical RNG ===
def classical_rng(size: int) -> np.ndarray:
    return np.random.normal(0, 1, size)

# === Quantum RNG (pseudo-random using Qiskit) ===
def quantum_rng(size: int) -> np.ndarray:
    backend = Aer.get_backend("qasm_simulator")
    qrng = []

    for _ in range(size):
        qc = QuantumCircuit(1, 1)
        qc.h(0)
        qc.measure(0, 0)
        result = backend.run(qc, shots=1).result()
        bit = int(result.get_counts().most_frequent())
        qrng.append(bit)

    # Convert bits to normal (box-muller or simple mapping)
    uniform = np.array(qrng)
    normal_approx = (uniform - 0.5) * 2  # basic rescaling [-1, 1]
    return normal_approx

# === Base Model Interface ===
class PricingModel:
    def simulate(self, z: float) -> float:
        raise NotImplementedError

    def quantum_payoff(self) -> EstimationProblem:
        raise NotImplementedError

# === European Call Option Model ===
class EuropeanCallOption(PricingModel):
    def __init__(self, S0, K, T, r, sigma):
        self.S0 = S0
        self.K = K
        self.T = T
        self.r = r
        self.sigma = sigma

    def simulate(self, z: float) -> float:
        ST = self.S0 * np.exp((self.r - 0.5 * self.sigma ** 2) * self.T + self.sigma * np.sqrt(self.T) * z)
        return np.exp(-self.r * self.T) * max(ST - self.K, 0)

    def quantum_payoff(self) -> EstimationProblem:
        num_qubits = 3
        mu = 0
        sigma = 1

        normal = NormalDistribution(num_qubits, mu=mu, sigma=sigma)
        circuit = QuantumCircuit(num_qubits)
        circuit.compose(normal, inplace=True)

        # Define payoff as a thresholded function
        def f(x):
            price = self.S0 * np.exp((self.r - 0.5 * self.sigma**2) * self.T + self.sigma * np.sqrt(self.T) * x)
            payoff = np.exp(-self.r * self.T) * max(price - self.K, 0)
            return payoff

        # Dummy estimation circuit
        return EstimationProblem(
            state_preparation=circuit,
            objective_qubits=[num_qubits - 1],
            post_processing=lambda x: x
        )

# === QMCSimulator ===
class QMCSimulator:
    def __init__(self, model: PricingModel, num_samples: int = 1000, use_qrng: bool = False):
        self.model = model
        self.num_samples = num_samples
        self.use_qrng = use_qrng

    def run_classical_monte_carlo(self) -> tuple:
        rng = quantum_rng if self.use_qrng else classical_rng
        z = rng(self.num_samples)
        payoffs = [self.model.simulate(zi) for zi in z]
        return np.mean(payoffs), np.std(payoffs)

    def run_quantum_amplitude_estimation(self, epsilon: float = 0.01):
        sampler = Sampler()
        qae = IterativeAmplitudeEstimation(epsilon_target=epsilon, sampler=sampler)
        problem = self.model.quantum_payoff()
        result = qae.estimate(problem)
        return result.estimation

# === Usage Example ===
if __name__ == "__main__":
    model = EuropeanCallOption(S0=100, K=100, T=1.0, r=0.05, sigma=0.2)
    simulator = QMCSimulator(model, num_samples=1000, use_qrng=True)

    mean, std = simulator.run_classical_monte_carlo()
    print(f"[Classical MC] Mean = {mean:.4f}, Std = {std:.4f}")

    try:
        qae_result = simulator.run_quantum_amplitude_estimation()
        print(f"[Quantum Amplitude Estimation] Result = {qae_result:.4f}")
    except Exception as e:
        print(f"[QAE Error] {e}")
