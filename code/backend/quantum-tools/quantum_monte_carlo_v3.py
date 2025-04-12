import numpy as np
import matplotlib.pyplot as plt
from scipy.special import erfinv

# -----------------------------------------------------
# Qiskit Imports for Quantum RNG & Amplitude Estimation
# -----------------------------------------------------
from qiskit import QuantumCircuit
from qiskit_aer import Aer, AerSimulator
from qiskit_algorithms import AmplitudeEstimation
from qiskit_finance.applications import EuropeanCallPricing
from qiskit_finance.circuit.library import LogNormalDistribution
from qiskit_algorithms.amplitude_estimators.estimation_problem import EstimationProblem
from qiskit.primitives import Sampler

# ------------------------------------------------------------------------------
# Dummy Sampler implementation (for qiskit-aer 0.17.0)
#
# qiskit‑algorithms 0.3.1 expects a Sampler primitive (normally available via
# “from qiskit.providers.aer.primitives import Sampler”) but that isn’t present
# in qiskit‑aer 0.17.0. We therefore wrap the AerSimulator to supply a minimal
# sampler-like interface.
# ------------------------------------------------------------------------------
class DummySampler:
    def __init__(self):
        # Initialize an AerSimulator instance.
        self._simulator = AerSimulator()

    def run(self, circuits, **run_options):
        """
        Run the given circuit(s) using the AerSimulator and return the result.
        This mimics the basic behavior of the new Sampler primitive.
        """
        # Ensure circuits is a list (the new interface usually accepts a list)
        if not isinstance(circuits, list):
            circuits = [circuits]
        # Run the circuits and return the result
        job = self._simulator.run(circuits, **run_options)
        result = job.result()
        return result

# -----------------------------
# Classical Pricing Model
# -----------------------------
def european_call_payoff(S, strike):
    """European Call Option payoff function."""
    return np.maximum(S - strike, 0)


# -------------------------------------------------------------
# Quantum Random Number Generation (via Qiskit/Qasm Simulator)
# -------------------------------------------------------------
def quantum_random_normal(num_samples, num_qubits=16):
    """
    Generate 'num_samples' from a normal distribution using a quantum RNG.

    Procedure:
      1. Create a circuit that puts 'num_qubits' into superposition.
      2. Measure to obtain bitstrings.
      3. Convert each bitstring to an integer and normalize into [0, 1).
      4. Transform uniform values to a normal distribution using the inverse error function.

    The inverse transformation applied is:
         x = sqrt(2) * erfinv(2u - 1)
    """
    qc = QuantumCircuit(num_qubits, num_qubits)
    qc.h(range(num_qubits))
    qc.measure(range(num_qubits), range(num_qubits))

    backend = Aer.get_backend('qasm_simulator')
    # Run circuit with a number of shots equal to num_samples
    job = backend.run(qc, shots=num_samples, memory=True)
    result = job.result()
    # get_memory returns a list of bitstring results (one per shot)
    memory = result.get_memory(qc)

    # Convert bitstrings to integers and then normalize to [0, 1)
    random_ints = [int(bits, 2) for bits in memory]
    uniform_values = np.array(random_ints) / float(2**num_qubits)

    # Transform uniform distribution to normal using inverse error function.
    normal_values = np.sqrt(2) * erfinv(2 * uniform_values - 1)
    return normal_values


def quantum_random_increments(num_samples, dt, num_qubits=16):
    """
    Generate 'num_samples' of normally distributed increments,
    scaled by sqrt(dt), using the quantum RNG.
    """
    normals = quantum_random_normal(num_samples, num_qubits=num_qubits)
    return normals * np.sqrt(dt)


# -------------------------------------------------------------
# Quantum Monte Carlo Simulator: Classical & QAE Methods
# -------------------------------------------------------------
class QuantumMonteCarloSimulator:
    def __init__(self,
                 S0=100, r=0.05, sigma=0.2, T=1.0, strike=100,
                 steps=252, paths=10000, pricing_model=european_call_payoff):
        self.S0 = S0
        self.r = r
        self.sigma = sigma
        self.T = T
        self.strike = strike
        self.steps = steps
        self.paths = paths
        self.pricing_model = pricing_model

    def _get_rng_increments(self, size, dt, rng_type='classical'):
        if rng_type == 'classical':
            return np.random.normal(0, np.sqrt(dt), size=size)
        elif rng_type == 'quantum':
            return quantum_random_increments(num_samples=size, dt=dt)
        else:
            raise ValueError("rng_type must be either 'classical' or 'quantum'.")

    def simulate_paths(self, rng_type='classical'):
        dt = self.T / self.steps
        time_grid = np.linspace(0, self.T, self.steps + 1)
        paths = np.zeros((self.paths, self.steps + 1))
        paths[:, 0] = self.S0

        for t in range(1, self.steps + 1):
            dW = self._get_rng_increments(size=self.paths, dt=dt, rng_type=rng_type)
            paths[:, t] = paths[:, t - 1] * np.exp((self.r - 0.5 * self.sigma**2) * dt + self.sigma * dW)
        return time_grid, paths

    def compute_option_price(self, terminal_prices):
        payoffs = self.pricing_model(terminal_prices, self.strike)
        discounted_payoffs = np.exp(-self.r * self.T) * payoffs
        estimated_price = np.mean(discounted_payoffs)
        return estimated_price, discounted_payoffs

    def run_classical_simulation(self, rng_type='classical', visualize=True):
        time_grid, paths = self.simulate_paths(rng_type=rng_type)
        terminal_prices = paths[:, -1]
        estimated_price, _ = self.compute_option_price(terminal_prices)
        print("Estimated Option Price (Classical MC with {} RNG): {:.4f}".format(rng_type, estimated_price))
        if visualize:
            self.visualize_simulation(time_grid, paths, terminal_prices, estimated_price)
        return estimated_price

    def visualize_simulation(self, time_grid, paths, terminal_prices, estimated_price):
        num_paths_to_plot = min(10, paths.shape[0])
        plt.figure(figsize=(14, 6))

        plt.subplot(1, 2, 1)
        for i in range(num_paths_to_plot):
            plt.plot(time_grid, paths[i, :], lw=1)
        plt.xlabel("Time (years)")
        plt.ylabel("Asset Price")
        plt.title("Sample Asset Paths")

        plt.subplot(1, 2, 2)
        plt.hist(terminal_prices, bins=30, alpha=0.75, edgecolor='black')
        plt.xlabel("Terminal Asset Price")
        plt.ylabel("Frequency")
        plt.title("Distribution of Terminal Asset Prices")
        plt.axvline(np.mean(terminal_prices), color='red', linestyle='dashed', linewidth=2,
                    label="Mean Terminal Price")
        plt.legend()
        plt.suptitle(f"Monte Carlo Simulation (Option Price: {estimated_price:.4f})", fontsize=16)
        plt.tight_layout(rect=[0, 0.03, 1, 0.95])
        plt.show()

    def run_quantum_amplitude_estimation(self, num_eval_qubits=3):
        try:
            num_qubits = 3
            bounds = (0, 2 * self.S0)

            mu = np.log(self.S0) + (self.r - 0.5 * self.sigma ** 2) * self.T
            sigma_tilde = self.sigma * np.sqrt(self.T)

            uncertainty_model = LogNormalDistribution(
                num_qubits=num_qubits,
                mu=mu,
                sigma=sigma_tilde,
                bounds=bounds
            )

            european_call = EuropeanCallPricing(
                num_state_qubits=num_qubits,
                strike_price=self.strike,
                bounds=bounds,
                uncertainty_model=uncertainty_model,
                rescaling_factor=0.25
            )

            sampler = Sampler()
            ae = AmplitudeEstimation(num_eval_qubits=num_eval_qubits, sampler=sampler)

            # ✅ Create the EstimationProblem manually
            rescaling_factor = 0.25  # Match this to what you passed to EuropeanCallPricing

            problem = EstimationProblem(
                state_preparation=european_call._state_preparation,
                objective_qubits=european_call._objective_qubits,
                post_processing=lambda x: x * rescaling_factor
            )

            result = ae.estimate(problem)
            estimated_price = result.estimation

            print("Estimated Option Price (Quantum Amplitude Estimation): {:.4f}".format(estimated_price))
            return estimated_price, result

        except Exception as e:
            print("Error during quantum amplitude estimation:")
            raise e


# -----------------------------
# Example Usage
# -----------------------------
if __name__ == "__main__":
    simulator = QuantumMonteCarloSimulator(paths=1000)

    print("=== Running Classical Monte Carlo Simulation with Classical RNG ===")
    simulator.run_classical_simulation(rng_type='classical', visualize=True)

    print("\n=== Running Classical Monte Carlo Simulation with Quantum RNG ===")
    simulator.run_classical_simulation(rng_type='quantum', visualize=True)

    print("\n=== Running Quantum Amplitude Estimation using Qiskit ===")
    simulator.run_quantum_amplitude_estimation(num_eval_qubits=3)
