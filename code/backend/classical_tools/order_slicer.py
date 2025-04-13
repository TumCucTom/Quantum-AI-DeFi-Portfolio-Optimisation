import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import requests


class OrderSlicer:
    def __init__(self, total_quantity: int, start_time: str, end_time: str, frequency: str = "1min"):
        self.total_quantity = total_quantity
        self.start_time = pd.Timestamp(start_time)
        self.end_time = pd.Timestamp(end_time)
        self.frequency = frequency
        self.schedule = pd.date_range(start=self.start_time, end=self.end_time, freq=self.frequency)
        self.num_slices = len(self.schedule)

    def twap(self):
        """Time-weighted average price slicing: equal size per time slice."""
        slice_qty = self.total_quantity // self.num_slices
        quantities = [slice_qty] * self.num_slices
        remaining = self.total_quantity - sum(quantities)
        quantities[-1] += remaining
        return pd.DataFrame({"timestamp": self.schedule, "quantity": quantities})

    def fetch_live_volume_profile(self, token_pair=("USDC", "ETH")):
        """
        Mocked live volume profile fetch from a DeFi API.
        Returns a normalized numpy array of relative volumes.
        """
        try:
            url = "https://api.wormholescan.io/defi/volume_profile"  # placeholder
            response = requests.get(url, params={"from_token": token_pair[0], "to_token": token_pair[1]})
            response.raise_for_status()
            profile_data = response.json()

            profile = [profile_data.get(str(ts.time()), 1) for ts in self.schedule]
            profile = np.array(profile)
            if profile.sum() == 0:
                raise ValueError("Invalid volume data")
            return profile / profile.sum()
        except Exception as e:
            print(f"⚠️ Using default volume profile. Error: {e}")
            default = np.array([1 + np.sin(i / self.num_slices * np.pi) for i in range(self.num_slices)])
            return default / default.sum()

    def vwap(self, volume_profile: list = None, token_pair=("USDC", "ETH")):
        """
        Volume-weighted average price slicing.
        If volume_profile is None, fetches live data.
        """
        if volume_profile is None:
            volume_profile = self.fetch_live_volume_profile(token_pair)

        if len(volume_profile) != self.num_slices:
            raise ValueError("Volume profile length must match number of slices.")
        if not np.isclose(sum(volume_profile), 1.0):
            raise ValueError("Volume profile must sum to 1.")

        quantities = [int(q) for q in np.round(np.array(volume_profile) * self.total_quantity)]
        remaining = self.total_quantity - sum(quantities)
        quantities[-1] += remaining
        return pd.DataFrame({"timestamp": self.schedule, "quantity": quantities})

    def plot(self, df: pd.DataFrame, title="Order Slicing"):
        plt.figure(figsize=(10, 4))
        plt.bar(df['timestamp'], df['quantity'], width=0.01)
        plt.title(title)
        plt.xlabel("Time")
        plt.ylabel("Quantity")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

def run_twap():
    slicer = OrderSlicer(
        total_quantity=100000,
        start_time="2025-04-11 09:30",
        end_time="2025-04-11 10:30",
        frequency="5min"
    )

    # TWAP
    twap_df = slicer.twap()
    print("TWAP Order Slicing:")
    print(twap_df)
    slicer.plot(twap_df, title="TWAP Order Slicing")

def run_vwap():
    slicer = OrderSlicer(
        total_quantity=100000,
        start_time="2025-04-11 09:30",
        end_time="2025-04-11 10:30",
        frequency="5min"
    )

    # VWAP with live data fallback
    vwap_df = slicer.vwap(token_pair=("USDC", "ETH"))
    print("\nVWAP Order Slicing (Live Data or Fallback):")
    print(vwap_df)
    slicer.plot(vwap_df, title="VWAP Order Slicing (Live or Fallback)")

# === Example Usage ===
if __name__ == "__main__":
    slicer = OrderSlicer(
        total_quantity=100000,
        start_time="2025-04-11 09:30",
        end_time="2025-04-11 10:30",
        frequency="5min"
    )

    # TWAP
    twap_df = slicer.twap()
    print("TWAP Order Slicing:")
    print(twap_df)
    slicer.plot(twap_df, title="TWAP Order Slicing")

    # VWAP with live data fallback
    vwap_df = slicer.vwap(token_pair=("USDC", "ETH"))
    print("\nVWAP Order Slicing (Live Data or Fallback):")
    print(vwap_df)
    slicer.plot(vwap_df, title="VWAP Order Slicing (Live or Fallback)")
