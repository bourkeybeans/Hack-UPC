import numpy as np
from collections import deque


class EEGProcessor:
    """
    A processor for EEG data that separates signals into different wave types
    via a Fast Fourier Transform (FFT)
    """

    def __init__(
        self,
        num_channels=5,
        sample_rate=256,
        window_seconds=2,
        smoothing=0.8  # exponential smoothing (0 = none, 0.9 = very smooth)
    ):
        """
        Initialises a new `EEGProcessor` instance

        :param num_channels: The number of channels that will be fed to the processor
        :param sample_rate: The number of samples per second that will be performed
        :param window_seconds: The window time in seconds that FFT will be applied over
        :param smoothing: The smoothing factor to apply to signals (closer to 1 is more smoothing)
        """

        self.num_channels = num_channels
        self.sample_rate = sample_rate
        self.window_size = int(sample_rate * window_seconds)
        self.smoothing = smoothing

        # Initialise rolling buffers for each channel
        self.buffers = [
            deque(maxlen=self.window_size)
            for _ in range(num_channels)
        ]

        # Previous smoothed output
        self.prev_output = None


    def update(self, samples):
        """
        Updates the EEGProcessor with a new sample. Should be called with each new sample

        :param samples: a list of lists of samples to be processed (first dim of samples should equal to num_channels)
        """

        for i in range(self.num_channels):
            self.buffers[i].append(samples[i])

        # Wait until buffers are full
        if len(self.buffers[0]) < self.window_size:
            return None

        # Process all channels
        channel_results = [
            self._process_channel(np.array(buf))
            for buf in self.buffers
        ]

        combined = self._combine_channels(channel_results)

        smoothed = self._smooth(combined)

        return smoothed


    def _process_channel(self, data) -> dict[str, float]:
        """
        Process a specific channel of data using Fast Fourier Transform (FFT)

        :param data: The channel of data to process
        :
        """

        windowed = data * np.hamming(len(data))

        # Perform FFT analysis
        fft_vals = np.fft.rfft(windowed)
        power = np.abs(fft_vals) ** 2
        freqs = np.fft.rfftfreq(len(data), 1 / self.sample_rate)

        total = self._band_power_raw(freqs, power, 13, 30) / (self._band_power_raw(freqs, power, 4, 8) + 1e-8)

        return {
            "delta": self._band_power_normalised(freqs, power, 0.5, 4),
            "theta": self._band_power_normalised(freqs, power, 4, 8),
            "alpha": self._band_power_normalised(freqs, power, 8, 13),
            "beta": self._band_power_normalised(freqs, power, 13, 30),
            "gamma": self._band_power_normalised(freqs, power, 30, 50),
            "focus": total
        }
    

    def _band_power_normalised(self, freqs, power, low, high):
        """
        Filter the frequencies into bands and return a normalised value

        :param freqs: The array of frequencies in the window
        :param power: The power values returned by the FFT
        :param low: The lower bound for this frequency range
        :param high: The upper bound for this frequency range
        """

        idx = (freqs >= low) & (freqs <= high)
        band = np.sum(power[idx])

        return np.log1p(band)
    

    def _band_power_raw(self, freqs, power, low, high):
        idx = (freqs >= low) & (freqs <= high)
        band = np.sum(power[idx])

        return band


    def _combine_channels(self, channel_results):
        """
        Combines separate channel data into a single result

        :param channel_results: The separate channel results to combine
        :return results: The combined normalised results for the sample
        """

        combined = {}

        for band in channel_results[0].keys():
            combined[band] = np.mean([
                ch[band] for ch in channel_results
            ])

        total = sum(combined.values()) + 1e-8

        normalized = {
            band: combined[band] / total
            for band in combined
        }

        normalized["focus"] = combined["focus"]
        # normalized["focus"] = normalized["beta"] / (normalized["theta"] + 1e-8)

        return normalized


    def _smooth(self, current):
        """
        Smooths the output from a single sample

        :param current: The current samples to smooth
        """

        if self.prev_output is None:
            self.prev_output = current
            return current

        smoothed = {}
        for key in current:
            smoothed[key] = (
                self.smoothing * self.prev_output[key]
                + (1 - self.smoothing) * current[key]
            )

        self.prev_output = smoothed
        return smoothed