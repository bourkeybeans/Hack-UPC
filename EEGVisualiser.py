import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from collections import deque
import threading


class EEGVisualizer:
    def __init__(self, sample_rate=256, window_seconds=5):
        self.sample_rate = sample_rate
        self.max_samples = sample_rate * window_seconds

        # rolling buffers (deque = efficient sliding window)
        self.buffer_ch1 = deque(maxlen=self.max_samples)
        self.buffer_ch2 = deque(maxlen=self.max_samples)

        self.lock = threading.Lock()

        # setup plot
        self.fig, self.ax = plt.subplots()
        self.line1, = self.ax.plot([], [], label="Channel 1")
        self.line2, = self.ax.plot([], [], label="Channel 2")

        self.ax.set_title("Real-time EEG")
        self.ax.set_xlabel("Samples")
        self.ax.set_ylabel("Amplitude (µV)")
        self.ax.legend()

    def update_data(self, data, timestamps):
        """
        data shape = (5 channels, 12 samples)
        """
        with self.lock:
            # take first 2 channels for clarity
            self.buffer_ch1.extend(data[0])
            self.buffer_ch2.extend(data[1])

    def _update_plot(self, frame):
        with self.lock:
            y1 = np.array(self.buffer_ch1)
            y2 = np.array(self.buffer_ch2)

        if len(y1) == 0:
            return self.line1, self.line2

        x = np.arange(len(y1))

        self.line1.set_data(x, y1)
        self.line2.set_data(x, y2)

        self.ax.set_xlim(0, self.max_samples)
        self.ax.set_ylim(-500, 500)  # adjust if needed

        return self.line1, self.line2

    def start(self):
        self.ani = FuncAnimation(
            self.fig,
            self._update_plot,
            interval=50,
            blit=True,
            cache_frame_data=False  # fixes warning
        )
        plt.show()