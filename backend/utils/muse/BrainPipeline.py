from utils.muse.MetricComputator import MetricComputator

class BrainPipeline:
    def __init__(self):
        self.metrics = MetricComputator()

    def on_eeg(self, data, timestamps):
        result = self.metrics.update(data, timestamps)

        print(result)

        return result