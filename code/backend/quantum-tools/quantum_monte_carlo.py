import numpy as np
import matplotlib.pyplot as plt

# Define a default pricing model: European Call Option payoff
def european_call_payoff(S, strike):
    return np.maximum(S - strike, 0)

class QuantumMonteCarloSimulator:
    def __init__(self,
                 S0=100,        # Initial asset price
                 r=0.05,        # Risk-free rate
                 sigma=0.2,     # Volatility
                 T=1.0,         # Time to maturity (years)
                 strike=100,    # Strike price for option payoff
                 steps=252,     # Number of time steps (e.g., daily steps in a year)
                 paths=10000,   # Number of simulated paths for classical simulation
                 pricing_model=european_call_payoff):
        self.S0 = S0
        self.r = r
        self.sigma = sigma
        self.T = T
        self.strike = strike
        self.steps = steps
        self.paths = paths
        self.pricing_model = pricing_model

    def _get_rng_increments(self, size, dt, rng_type='classical'):
        """Generate random increments (dW) using classical or mock quantum RNG."""
        if rng_type == 'classical':
            return np.random.normal(0, np.sqrt(dt), size=size)
        elif rng_type == 'quantum':
            # Here we mock a quantum RNG – in reality,
            # you could plug in a true quantum RNG API.
            print("Using mock quantum RNG for generating random numbers.")
            return np.random.normal(0, np.sqrt(dt), size=size)
        else:
            raise ValueError("RNG type must be either 'classical' or 'quantum'.")

    def simulate_paths(self, rng_type='classical', use_quantum_amp=False):
        """
        Simulate asset price paths under geometric Brownian motion.

        If use_quantum_amp is True, we mimic the quadratic speed-up of quantum amplitude
        estimation by reducing the number of paths (roughly sqrt(paths)).
        """
        if use_quantum_amp:
            # Quantum amplitude estimation (QAE) provides quadratic speed-up,
            # so we mimic that by reducing the number of paths.
            effective_paths = int(np.sqrt(self.paths))
            print(f"Using quantum amplitude estimation mock: {effective_paths} paths (versus {self.paths} classical paths)")
        else:
            effective_paths = self.paths

        dt = self.T / self.steps
        time_grid = np.linspace(0, self.T, self.steps+1)
        # Initialize paths: rows are different trajectories
        paths = np.zeros((effective_paths, self.steps+1))
        paths[:, 0] = self.S0

        # Simulate paths step by step using the Euler method for GBM
        for t in range(1, self.steps + 1):
            dW = self._get_rng_increments(size=effective_paths, dt=dt, rng_type=rng_type)
            paths[:, t] = paths[:, t-1] * np.exp((self.r - 0.5 * self.sigma**2)*dt + self.sigma * dW)

        return time_grid, paths

    def compute_option_price(self, terminal_prices):
        """
        Computes the discounted expected payoff for the option using the supplied pricing model.
        """
        payoffs = self.pricing_model(terminal_prices, self.strike)
        discounted_payoff = np.exp(-self.r * self.T) * payoffs
        estimated_price = np.mean(discounted_payoff)
        return estimated_price, discounted_payoff

    def run_simulation(self, rng_type='classical', use_quantum_amp=False, visualize=True):
        """
        Run the Monte Carlo simulation using either classical or quantum RNG,
        and using quantum amplitude estimation mock if desired.
        It returns the estimated option price and produces visualizations.
        """
        # Simulate asset price paths
        time_grid, paths = self.simulate_paths(rng_type=rng_type, use_quantum_amp=use_quantum_amp)
        terminal_prices = paths[:, -1]

        # Compute the option price from simulated terminal prices
        estimated_price, discounted_payoffs = self.compute_option_price(terminal_prices)

        print("Estimated Option Price: {:.4f}".format(estimated_price))

        if visualize:
            self.visualize_simulation(time_grid, paths, terminal_prices, estimated_price)

        return estimated_price

    def visualize_simulation(self, time_grid, paths, terminal_prices, estimated_price):
        """
        Visualize a subset of asset paths and a histogram of terminal asset prices with the estimated option price.
        """
        num_paths_to_plot = min(10, paths.shape[0])  # plot up to 10 trajectories
        plt.figure(figsize=(14,6))

        # Plot sample asset paths over time
        plt.subplot(1, 2, 1)
        for i in range(num_paths_to_plot):
            plt.plot(time_grid, paths[i, :], lw=1)
        plt.xlabel("Time (years)")
        plt.ylabel("Asset Price")
        plt.title("Sample Asset Paths")

        # Plot histogram of terminal asset prices
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

# -------------------------------------------------------------------------
# Example usage: run both classical and quantum amplitude estimation mock runs
if __name__ == "__main__":
    # Instantiate the simulator with default parameters and pricing model.
    simulator = QuantumMonteCarloSimulator()

    print("=== Running Classical Monte Carlo Simulation ===")
    classical_price = simulator.run_simulation(rng_type='classical', use_quantum_amp=False, visualize=True)

    print("\n=== Running Quantum Monte Carlo Simulation (Mock QAE) ===")
    quantum_price = simulator.run_simulation(rng_type='quantum', use_quantum_amp=True, visualize=True)
