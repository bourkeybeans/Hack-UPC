import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from collections import deque
import threading


class EEGVisualiser:
    def __init__(self, sample_rate=256, window_seconds=5, n_channels=5):
        self.sample_rate = sample_rate
        self.max_samples = sample_rate * window_seconds
        self.n_channels = n_channels

        # create one buffer per channel
        self.buffers = [
            deque(maxlen=self.max_samples) for _ in range(n_channels)
        ]

        self.lock = threading.Lock()

        # setup plot
        self.fig, self.ax = plt.subplots()

        self.lines = []
        for i in range(n_channels):
            line, = self.ax.plot([], [], label=f"Ch {i+1}")
            self.lines.append(line)

        self.ax.set_title("Muse Headset EEG Data (5 channels)")
        self.ax.set_xlabel("Samples")
        self.ax.set_ylabel("Amplitude (µV)")
        self.ax.legend(loc="upper right")

        # vertical spacing between channels
        self.channel_spacing = 300

    def update_data(self, data, timestamps):
        """
        data shape = (5 channels, 12 samples)
        """
        with self.lock:
            for ch in range(self.n_channels):
                self.buffers[ch].extend(data[ch])

    def _update_plot(self, frame):
        with self.lock:
            ys = [np.array(buf) for buf in self.buffers]

        if len(ys[0]) == 0:
            return self.lines

        x = np.arange(len(ys[0]))

        for i, line in enumerate(self.lines):
            # stack channels vertically
            y = ys[i] + i * self.channel_spacing
            line.set_data(x, y)

        self.ax.set_xlim(0, self.max_samples)

        # adjust y limits dynamically based on number of channels
        self.ax.set_ylim(
            -500,
            self.channel_spacing * self.n_channels
        )

        return self.lines

    def start(self):
        self.ani = FuncAnimation(
            self.fig,
            self._update_plot,
            interval=50,
            blit=True,
            cache_frame_data=False
        )
        plt.show()