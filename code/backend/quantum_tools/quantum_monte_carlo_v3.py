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


def plot_qae_result(result):
    import numpy as np
    import matplotlib.pyplot as plt

    samples = result.samples

    try:
        # Case: samples is a dict of {value: probability}
        if isinstance(samples, dict):
            print("Raw QAE samples (dict format):")
            for val, prob in samples.items():
                print(f"  Value: {val:.6f}, Probability: {prob:.6f}")

            values = np.array(list(samples.keys()), dtype=float)
            probabilities = np.array(list(samples.values()), dtype=float)

        else:
            raise ValueError("Unsupported samples format. Got: " + str(type(samples)))

        # Sort values for clean plotting
        sort_idx = np.argsort(values)
        values = values[sort_idx]
        probabilities = probabilities[sort_idx]

        # Plot the distribution
        plt.figure(figsize=(10, 6))
        plt.bar(values, probabilities, width=0.02, alpha=0.7, edgecolor='black')
        plt.axvline(result.estimation, color='red', linestyle='--', linewidth=2,
                    label=f"Estimate: {result.estimation:.4f}")
        plt.xlabel("Estimated Value")
        plt.ylabel("Probability")
        plt.title("Quantum Amplitude Estimation Result")
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.show()

    except Exception as e:
        print("Error while plotting QAE result:", e)
        print("Type of samples:", type(samples))
        print("Contents:", samples)

def plot_qae_learning(simulator, num_qubits = 5, max_eval_qubits=6, show_classical=True, normalise=True):

    estimates = []
    ci_lowers = []
    ci_uppers = []

    # Use a dynamic rescaling factor based on bounds and strike
    bounds = (0, 5 * simulator.S0)
    rescaling_factor = bounds[1] - simulator.strike

    # Get classical price to compare
    classical_price = None
    if show_classical:
        classical_price, _ = simulator.compute_option_price(
            simulator.simulate_paths()[1][:, -1]
        )

    for q in range(1, max_eval_qubits + 1):
        print(f"Running QAE with {q} evaluation qubits...")

        mu = np.log(simulator.S0) + (simulator.r - 0.5 * simulator.sigma ** 2) * simulator.T
        sigma_tilde = simulator.sigma * np.sqrt(simulator.T)

        uncertainty_model = LogNormalDistribution(
            num_qubits=num_qubits,
            mu=mu,
            sigma=sigma_tilde,
            bounds=bounds
        )

        european_call = EuropeanCallPricing(
            num_state_qubits=num_qubits,
            strike_price=simulator.strike,
            bounds=bounds,
            uncertainty_model=uncertainty_model,
            rescaling_factor=rescaling_factor
        )

        problem = EstimationProblem(
            state_preparation=european_call._state_preparation,
            objective_qubits=european_call._objective_qubits,
            post_processing=lambda x: x * rescaling_factor
        )

        ae = AmplitudeEstimation(num_eval_qubits=q, sampler=Sampler())
        result = ae.estimate(problem)

        est = result.estimation
        ci = result.confidence_interval

        # Normalize if requested
        if normalise:
            est /= rescaling_factor
            ci = [c / rescaling_factor for c in ci]
            classical_norm = classical_price / rescaling_factor if classical_price else None
        else:
            classical_norm = classical_price

        estimates.append(est)
        ci_lowers.append(ci[0])
        ci_uppers.append(ci[1])

    # Plotting
    eval_range = range(1, max_eval_qubits + 1)
    plt.figure(figsize=(10, 6))
    plt.plot(eval_range, estimates, marker='o', label='QAE Estimate (normalised)' if normalise else 'QAE Estimate')
    plt.fill_between(eval_range, ci_lowers, ci_uppers, alpha=0.3, label='Confidence Interval')
    plt.plot(eval_range, ci_lowers, '--', color='gray', alpha=0.5)
    plt.plot(eval_range, ci_uppers, '--', color='gray', alpha=0.5)

    if show_classical and classical_norm:
        plt.axhline(classical_norm, color='green', linestyle='--', linewidth=2,
                    label=f'Classical MC (normalised): {classical_norm:.4f}')

    plt.xlabel("Number of Evaluation Qubits")
    plt.ylabel("Normalized Option Price" if normalise else "Estimated Option Price")
    plt.title("Quantum Amplitude Estimation Learning Curve")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()


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
      3. Convert each bitstring to an integer and normalise into [0, 1).
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

    # Convert bitstrings to integers and then normalise to [0, 1)
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
                rescaling_factor = bounds[1] - simulator.strike
            )

            sampler = Sampler()
            ae = AmplitudeEstimation(num_eval_qubits=num_eval_qubits, sampler=sampler)

            # ✅ Create the EstimationProblem manually
            rescaling_factor = bounds[1] - simulator.strike

            problem = EstimationProblem(
                state_preparation=european_call._state_preparation,
                objective_qubits=european_call._objective_qubits,
                post_processing=lambda x: x * rescaling_factor
            )

            result = ae.estimate(problem)
            estimated_price = result.estimation
            print("Estimated Option Price (Quantum Amplitude Estimation): {:.4f}".format(estimated_price))

            # 📊 Plot the likelihood distribution
            plot_qae_result(result)

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

    print("=== Running QAE Learning Curve ===")
    plot_qae_learning(simulator, num_qubits=4, max_eval_qubits=6, normalise=True)
