import numpy as np
from scipy.special import erfinv
import json

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
# ------------------------------------------------------------------------------
class DummySampler:
    def __init__(self):
        self._simulator = AerSimulator()

    def run(self, circuits, **run_options):
        if not isinstance(circuits, list):
            circuits = [circuits]
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
    The transformation is: x = sqrt(2) * erfinv(2u - 1)
    """
    qc = QuantumCircuit(num_qubits, num_qubits)
    qc.h(range(num_qubits))
    qc.measure(range(num_qubits), range(num_qubits))

    backend = Aer.get_backend('qasm_simulator')
    job = backend.run(qc, shots=num_samples, memory=True)
    result = job.result()
    memory = result.get_memory(qc)
    random_ints = [int(bits, 2) for bits in memory]
    uniform_values = np.array(random_ints) / float(2**num_qubits)
    normal_values = np.sqrt(2) * erfinv(2 * uniform_values - 1)
    return normal_values

def quantum_random_increments(num_samples, dt, num_qubits=16):
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

    def run_classical_simulation(self, rng_type='classical'):
        time_grid, paths = self.simulate_paths(rng_type=rng_type)
        terminal_prices = paths[:, -1]
        estimated_price, _ = self.compute_option_price(terminal_prices)
        return time_grid, paths, terminal_prices, estimated_price

    def run_quantum_amplitude_estimation(self, num_eval_qubits=3):
        # Use a fixed number of state qubits for the uncertainty model:
        num_qubits = 3
        bounds = (0, 2 * self.S0)
        mu = np.log(self.S0) + (self.r - 0.5 * self.sigma**2) * self.T
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
            rescaling_factor=(bounds[1] - self.strike)
        )
        sampler = Sampler()
        ae = AmplitudeEstimation(num_eval_qubits=num_eval_qubits, sampler=sampler)
        rescaling_factor = bounds[1] - self.strike

        problem = EstimationProblem(
            state_preparation=european_call._state_preparation,
            objective_qubits=european_call._objective_qubits,
            post_processing=lambda x: x * rescaling_factor
        )
        result = ae.estimate(problem)
        return result

# ------------------------------------------------------------------------------
# The API endpoint function that collects all simulation data into JSON.
# ------------------------------------------------------------------------------
def quantum_monte_carlo_endpoint(input_data=None):
    """
    API endpoint function for the Quantum Monte Carlo Simulator.
    If input_data is None, default simulation parameters are used.

    Returns a JSON-friendly dictionary with keys for:
      - 'classical_rng_simulation'
      - 'quantum_rng_simulation'
      - 'quantum_amplitude_estimation'
      - 'qae_learning_curve'

    Each key contains the data arrays (converted to lists) needed to reconstruct the plots.
    """
    # Default parameters (override with input_data if provided)
    defaults = {
        "S0": 100,
        "r": 0.05,
        "sigma": 0.2,
        "T": 1.0,
        "strike": 100,
        "steps": 252,
        "paths": 1000
    }
    if input_data is not None:
        # Override defaults with provided input_data.
        params = {**defaults, **input_data}
    else:
        params = defaults

    # Create simulator instance with provided/default parameters.
    simulator = QuantumMonteCarloSimulator(
        S0=params["S0"],
        r=params["r"],
        sigma=params["sigma"],
        T=params["T"],
        strike=params["strike"],
        steps=params["steps"],
        paths=params["paths"]
    )

    # -------------------------
    # 1. Classical Simulation (Classical RNG)
    # -------------------------
    time_grid_class, paths_class, term_prices_class, est_price_class = simulator.run_classical_simulation(rng_type='classical')
    # Select a few sample paths (up to 10)
    sample_paths_class = paths_class[:10, :].tolist()
    time_grid_list = time_grid_class.tolist()
    # Compute histogram of terminal prices with 30 bins
    hist_counts_class, hist_bins_class = np.histogram(term_prices_class, bins=30)
    classical_hist = {
        "bins": hist_bins_class.tolist(),
        "counts": hist_counts_class.tolist()
    }
    classical_simulation_data = {
        "time_grid": time_grid_list,
        "sample_paths": sample_paths_class,
        "terminal_prices": term_prices_class.tolist(),
        "estimated_price": float(est_price_class),
        "histogram": classical_hist
    }

    # -------------------------
    # 2. Classical Simulation (Quantum RNG)
    # -------------------------
    time_grid_quant, paths_quant = simulator.run_classical_simulation(rng_type='quantum')[0:4]
    # Unpack the output:
    time_grid_quant, paths_quant, term_prices_quant, est_price_quant = simulator.run_classical_simulation(rng_type='quantum')
    sample_paths_quant = paths_quant[:10, :].tolist()
    time_grid_quant_list = time_grid_quant.tolist()
    hist_counts_quant, hist_bins_quant = np.histogram(term_prices_quant, bins=30)
    quantum_hist = {
        "bins": hist_bins_quant.tolist(),
        "counts": hist_counts_quant.tolist()
    }
    quantum_simulation_data = {
        "time_grid": time_grid_quant_list,
        "sample_paths": sample_paths_quant,
        "terminal_prices": term_prices_quant.tolist(),
        "estimated_price": float(est_price_quant),
        "histogram": quantum_hist
    }

    # -------------------------
    # 3. Quantum Amplitude Estimation (QAE)
    # -------------------------
    result_qae = simulator.run_quantum_amplitude_estimation(num_eval_qubits=3)
    # Assuming result_qae.samples is a dict of {value: probability}
    # Convert samples to a list of dictionaries for JSON friendliness.
    qae_samples = []
    if isinstance(result_qae.samples, dict):
        for val, prob in result_qae.samples.items():
            qae_samples.append({"value": float(val), "probability": float(prob)})
    qae_data = {
        "estimate": float(result_qae.estimation),
        "confidence_interval": [float(result_qae.confidence_interval[0]), float(result_qae.confidence_interval[1])],
        "samples": qae_samples
    }

    # -------------------------
    # 4. QAE Learning Curve
    # -------------------------
    # Parameters for learning curve
    num_qubits = 4     # number of state qubits for the uncertainty model
    max_eval_qubits = 6
    normalise = True
    # Use bounds and rescaling factor as in the original plot_qae_learning function
    bounds = (0, 5 * simulator.S0)
    rescaling_factor = bounds[1] - simulator.strike

    # For classical comparison, generate simulation using default RNG (classical)
    _, _, term_prices_temp, classical_price = simulator.run_classical_simulation(rng_type='classical')
    # Note: classical_price here is the option price from classical simulation.

    estimates = []
    ci_lowers = []
    ci_uppers = []
    for q in range(1, max_eval_qubits + 1):
        # Create the uncertainty model
        mu = np.log(simulator.S0) + (simulator.r - 0.5 * simulator.sigma**2) * simulator.T
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
        if normalise:
            est /= rescaling_factor
            ci = [ci[0] / rescaling_factor, ci[1] / rescaling_factor]
            classical_norm = classical_price / rescaling_factor
        else:
            classical_norm = classical_price
        estimates.append(float(est))
        ci_lowers.append(float(ci[0]))
        ci_uppers.append(float(ci[1]))
    qae_learning_data = {
        "eval_range": list(range(1, max_eval_qubits + 1)),
        "estimates": estimates,
        "confidence_intervals": [[ci_lowers[i], ci_uppers[i]] for i in range(len(estimates))],
        "classical_norm": float(classical_norm)
    }

    # -------------------------
    # Combine All Data into One JSON Structure
    # -------------------------
    output = {
        "classical_rng_simulation": classical_simulation_data,
        "quantum_rng_simulation": quantum_simulation_data,
        "quantum_amplitude_estimation": qae_data,
        "qae_learning_curve": qae_learning_data
    }
    return output

# ------------------------------------------------------------------------------
# Example: Running the API endpoint function directly.
# In a real API, you would hook this into your web framework.
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    # Call the endpoint with default data:
    result_json = quantum_monte_carlo_endpoint()
    # For demonstration, print the JSON output (pretty printed).
    print(json.dumps(result_json, indent=2))
