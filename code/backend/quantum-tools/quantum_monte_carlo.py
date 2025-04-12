import numpy as np
import matplotlib.pyplot as plt

from qiskit import QuantumCircuit, ClassicalRegister
from qiskit_algorithms.utils import algorithm_globals
from qiskit_algorithms.amplitude_estimators import IterativeAmplitudeEstimation, EstimationProblem
from qiskit_finance.circuit.library import NormalDistribution
from qiskit.circuit.library import LinearAmplitudeFunction
from qiskit.primitives import Sampler

# === Classical RNG ===
def classical_rng(size: int) -> np.ndarray:
    return np.random.normal(0, 1, size)

# === Quantum RNG using Sampler (Box–Muller to yield normal samples) ===
def quantum_rng(size: int) -> np.ndarray:
    sampler = Sampler()

    # Each normal sample requires 2 uniform samples → 2 circuits
    total_circuits = 2 * size
    circuits = []
    for _ in range(total_circuits):
        qc = QuantumCircuit(1, 1)
        qc.h(0)
        qc.measure(0, 0)
        circuits.append(qc)

    results = sampler.run(circuits).result()
    # Visualize one of the QRNG circuits' quasi distribution:
    quasi_first = results.quasi_dists[0]
    keys = list(quasi_first.keys())
    values = [quasi_first[k] for k in keys]
    plt.figure(figsize=(4,3))
    plt.bar(keys, values)
    plt.title("QRNG Circuit #0 Quasi Distribution")
    plt.xlabel("Measurement Outcome")
    plt.ylabel("Probability")
    plt.show()

    bits = []
    for outcome in results.quasi_dists:
        prob_1 = outcome.get(1, 0)
        # Simple threshold readout:
        bit = 1 if prob_1 > 0.5 else 0
        bits.append(bit)

    # Reshape bits into pairs for Box–Muller
    uniform_bits = np.array(bits).reshape(-1, 2)
    qrng = []
    for u1_bit, u2_bit in uniform_bits[:size]:
        # Add a random jitter (from classical RNG) so that a bit does not lead to a degenerate 0 or 1.
        u1 = (u1_bit + np.random.rand()) / 2  # in (0,1)
        u2 = (u2_bit + np.random.rand()) / 2
        # Box–Muller transform to generate a standard normal sample
        z = np.sqrt(-2 * np.log(u1)) * np.cos(2 * np.pi * u2)
        qrng.append(z)
    return np.array(qrng)

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
        # Classical simulation using Black-Scholes dynamics
        ST = self.S0 * np.exp((self.r - 0.5 * self.sigma ** 2) * self.T + self.sigma * np.sqrt(self.T) * z)
        return np.exp(-self.r * self.T) * max(ST - self.K, 0)

    def quantum_payoff(self) -> EstimationProblem:
        # --- Part 1: State Preparation ---
        # We use a NormalDistribution (with 3 qubits) to represent the uncertainty of x.
        num_state_qubits = 3
        uncertainty_model = NormalDistribution(num_state_qubits, mu=0, sigma=1)

        # --- Part 2: Payoff Encoding using LinearAmplitudeFunction ---
        # We approximate the option payoff over a domain x in [x_l, x_u]
        x_l = -1
        x_u = 1

        # Map x to the asset price S_T:
        S_l = self.S0 * np.exp((self.r - 0.5 * self.sigma ** 2)*self.T + self.sigma * np.sqrt(self.T)*x_l)
        S_u = self.S0 * np.exp((self.r - 0.5 * self.sigma ** 2)*self.T + self.sigma * np.sqrt(self.T)*x_u)

        # Define payoff: f(x) = exp(-rT)*max(S(x) - K, 0)
        f_Sl = max(np.exp(-self.r * self.T)*(S_l - self.K), 0)
        f_Su = max(np.exp(-self.r * self.T)*(S_u - self.K), 0)
        # For simplicity, we normalize the payoff so that f_Su is mapped to 1:
        scale = 1/(f_Su) if f_Su > 0 else 1.0
        # Normalized image values on the domain endpoints:
        f_xl_norm = f_Sl * scale
        f_xu_norm = f_Su * scale

        # Determine a linear function: f(x) ≈ slope * x + offset over [x_l, x_u]
        slope = (f_xu_norm - f_xl_norm) / (x_u - x_l)
        offset = f_xl_norm - slope * x_l

        # Build the payoff function circuit.
        # The LinearAmplitudeFunction will use one ancilla qubit.
        payoff_function = LinearAmplitudeFunction(
            num_state_qubits,
            slope=slope,
            offset=offset,
            domain=(x_l, x_u),
            image=(f_xl_norm, f_xu_norm),
        )

        # --- Part 3: Compose the complete circuit ---
        # The full circuit will have the state-preparation qubits plus ancilla qubits from payoff encoding.
        total_qubits = payoff_function.num_qubits  # already includes uncertainty qubits + ancilla
        circuit = QuantumCircuit(total_qubits, total_qubits)
        # Prepare the uncertainty state.
        circuit.compose(uncertainty_model, list(range(uncertainty_model.num_qubits)), inplace=True)
        # Encode the payoff function onto the ancilla (the LinearAmplitudeFunction acts on all qubits).
        assert payoff_function.num_qubits == circuit.num_qubits, "Mismatch between payoff function and total circuit qubits!"
        circuit.compose(payoff_function, list(range(total_qubits)), inplace=True)

        # Optional: Visualize the state-preparation circuit's quasi distribution.
        sampler = Sampler()
        # Create a measured copy of the uncertainty model
        measured_uncertainty = uncertainty_model.copy()
        measured_uncertainty.measure_all(inplace=True)
        sp_result = sampler.run([measured_uncertainty]).result().quasi_dists[0]
        keys = list(sp_result.keys())
        values = [sp_result[k] for k in keys]
        plt.figure(figsize=(4,3))
        plt.bar(keys, values)
        plt.title("Quasi Distribution: State Preparation (Uncertainty Model)")
        plt.xlabel("Measurement Outcome")
        plt.ylabel("Probability")
        plt.show()

        # Add measurement instructions for all qubits.
        circuit.measure(range(total_qubits), range(total_qubits))

        # Define a post-processing function that converts the amplitude estimation
        # back into an expected payoff.
        # Here, we multiply by (1/scale) to invert our normalization.
        def post_process(estimated_amplitude):
            return estimated_amplitude / scale

        return EstimationProblem(
            state_preparation=circuit,
            # Use the last qubit (ancilla) as objective.
            objective_qubits=[total_qubits - 1],
            post_processing=post_process
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

    def run_quantum_amplitude_estimation(self, epsilon: float = 0.01, visualize: bool = True):
        sampler = Sampler()
        qae = IterativeAmplitudeEstimation(epsilon_target=epsilon, alpha=0.05, sampler=sampler)
        problem = self.model.quantum_payoff()
        result = qae.estimate(problem)
        # Optionally visualize the quasi distribution of the full QAE circuit.
        if visualize:
            qae_circuit = problem.state_preparation.copy()
            qae_circuit.measure(range(qae_circuit.num_qubits), range(qae_circuit.num_qubits))
            qae_result = sampler.run([qae_circuit]).result().quasi_dists[0]

            keys = list(qae_result.keys())
            values = [qae_result[k] for k in keys]
            plt.figure(figsize=(4,3))
            plt.bar(keys, values)
            plt.title("Quasi Distribution: Full QAE Circuit")
            plt.xlabel("Measurement Outcome")
            plt.ylabel("Probability")
            plt.show()

            z = quantum_rng(10000)
            plt.hist(z, bins=50, density=True)
            plt.title("Box-Muller Quantum RNG → Normal Distribution")
            plt.xlabel("z")
            plt.ylabel("Density")
            plt.show()

            return result.estimation

# === Usage Example ===
if __name__ == "__main__":
    # For reproducibility
    algorithm_globals.random_seed = 42

    model = EuropeanCallOption(S0=100, K=100, T=1.0, r=0.05, sigma=0.2)
    simulator = QMCSimulator(model, num_samples=1000, use_qrng=True)

    mean, std = simulator.run_classical_monte_carlo()
    print(f"[Classical MC] Mean = {mean:.4f}, Std = {std:.4f}")

    try:
        qae_result = simulator.run_quantum_amplitude_estimation(epsilon=0.01, visualize=True)
        print(f"[Quantum Amplitude Estimation] Estimated Payoff = {qae_result:.4f}")
    except Exception as e:
        print(f"[QAE Error] {e}")
