import numpy as np
import matplotlib.pyplot as plt
from scipy.special import erfinv

# -----------------------------------------------------
# Qiskit Imports for Quantum RNG & Amplitude Estimation
# -----------------------------------------------------
from qiskit import QuantumCircuit
from qiskit_aer import Aer
from qiskit_algorithms import AmplitudeEstimation
# from qiskit_finance.applications.estimation import EuropeanCallPricing
from qiskit_finance.applications.estimation import EuropeanCallExpectedValue
from qiskit_finance.circuit.library import LogNormalDistribution
from qiskit.primitives import Sampler


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
            num_qubits = 3  # Can be adjusted for precision vs. performance

            mu = np.log(self.S0) + (self.r - 0.5 * self.sigma ** 2) * self.T
            sigma_tilde = self.sigma * np.sqrt(self.T)
            bounds = (0, 2 * self.S0)

            # Step 1: Create a LogNormalDistribution to represent the terminal asset price
            distribution = LogNormalDistribution(
                num_qubits=num_qubits,
                mu=mu,
                sigma=sigma_tilde,
                bounds=bounds
            )

            # Step 2: Set up the European call option pricing problem
            european_call = EuropeanCallExpectedValue(
                distribution=distribution,
                strike_price=self.strike,
                rescaling_factor=0.25 * bounds[1] ** 2,
                bounds=bounds
            )

            # Step 3: Run QAE
            sampler = Sampler()
            ae = AmplitudeEstimation(
                num_eval_qubits=num_eval_qubits,
                problem=european_call,
                sampler=sampler
            )
            result = ae.estimate()
            estimated_price = european_call.interpret(result)

            print("Estimated Option Price (Quantum Amplitude Estimation): {:.4f}".format(estimated_price))
            return estimated_price, result

        except Exception as e:
            print("Error during quantum amplitude estimation.")
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
