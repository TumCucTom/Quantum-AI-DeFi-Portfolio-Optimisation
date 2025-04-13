import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


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
        quantities[-1] += remaining  # assign any leftover to the last slice
        return pd.DataFrame({"timestamp": self.schedule, "quantity": quantities})

    def vwap(self, volume_profile: list):
        """
        Volume-weighted average price slicing.
        volume_profile: list or np.array of relative volume proportions (must sum to 1).
        """
        if len(volume_profile) != self.num_slices:
            raise ValueError("Volume profile length must match number of slices.")
        if not np.isclose(sum(volume_profile), 1.0):
            raise ValueError("Volume profile must sum to 1.")

        quantities = [int(q) for q in np.round(np.array(volume_profile) * self.total_quantity)]
        remaining = self.total_quantity - sum(quantities)
        quantities[-1] += remaining  # fix rounding error
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

    # VWAP (example volume profile: more volume in the middle of the window)
    volume_profile = np.array([1, 3, 5, 7, 5, 3, 1])
    volume_profile = volume_profile / volume_profile.sum()
    vwap_df = slicer.vwap(volume_profile=volume_profile)
    print("\nVWAP Order Slicing:")
    print(vwap_df)
    slicer.plot(vwap_df, title="VWAP Order Slicing")
