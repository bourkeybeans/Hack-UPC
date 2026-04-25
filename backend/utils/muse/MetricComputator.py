import numpy as np
from collections import deque


class MetricComputator:
    def __init__(self, window_size=20):
        # store recent EEG windows for smoothing
        self.window_size = window_size
        self.buffer = deque(maxlen=window_size)

        # baseline can be used for more accurate readings per user
        self.beta_baseline = None
        self.theta_baseline = None

        # smoothing
        self.alpha = 0.2  # EMA factor
        self.smoothed_focus = 0

    def _extract_band_powers(self, eeg_window):
        """
        eeg_window: (channels, samples)
        Returns approximate band power features.
        """
        
        # variance = signal activity
        variance = np.var(eeg_window, axis=1)

        # map channels roughly to bands
        # adjust if your mapping differs
        theta = np.mean(variance[:2])   # frontal
        alpha = np.mean(variance[2:4])  # mid
        beta  = np.mean(variance[3:5])  # higher activity

        return theta, alpha, beta


    def _compute_focus_score(self, theta, alpha, beta):
        eps = 1e-6

        raw_focus = beta / (theta + alpha + eps)

        # normalisation
        if self.beta_baseline is not None:
            raw_focus = raw_focus / (self.beta_baseline + eps)

        # clamp to [0, 1.5] then scale to 0–100
        raw_focus = np.clip(raw_focus, 0, 1.5)
        return raw_focus * 66.6  # ~100 max


    def _get_state(self, focus_score):
        if focus_score > 70:
            return "focused"
        elif focus_score > 40:
            return "neutral"
        else:
            return "distracted"



    def update(self, eeg, timestamps=None):
        """
        Called from Muse callback.
        eeg: (5, 12)
        """

        self.buffer.append(eeg)


        window = np.concatenate(list(self.buffer), axis=1)

        theta, alpha, beta = self._extract_band_powers(window)

        focus = self._compute_focus_score(theta, alpha, beta)

        self.smoothed_focus = (
            self.alpha * focus +
            (1 - self.alpha) * self.smoothed_focus
        )

        state = self._get_state(self.smoothed_focus)

        return {
            "focus_score": float(self.smoothed_focus),
            "raw_focus": float(focus),
            "theta": float(theta),
            "alpha": float(alpha),
            "beta": float(beta),
            "state": state
        }


    def calibrate(self, theta, alpha, beta):
        """
        Call this during a 30s "relaxed baseline" phase.
        """
        self.theta_baseline = theta
        self.beta_baseline = beta