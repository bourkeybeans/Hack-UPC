import asyncio
from utils.muse.MuseHeadset import MuseHeadset
from utils.muse.EEGProcessor import EEGProcessor

class ConnectionManager:
    """
    ConnectionManager that manages a connection to the muse headset
    """

    def __init__(self):
        """
        Initialises a `ConnectionManager` instance
        """

        self.muse = None
        self.address = None
        self.connected = False
        self.eeg_queue = asyncio.Queue()
        self.loop = asyncio.get_event_loop()
        self.streaming = False

        self.processor = EEGProcessor(
            num_channels=5,
            sample_rate=256,
            window_seconds=2,
            smoothing=0.3
        )

    async def connect(self, address: str) -> bool:
        """
        Attempts to connect to the muse headset at the provided address

        :param address: The address of the headset to connect to
        :returns success: A boolean vaue whether the connection was a success or not
        """

        if not address:
            return False
        
        if self.connected:
            raise RuntimeError("Already connected to a device")

        try:
            #from MuseHeadset import MuseHeadset

            self.muse = MuseHeadset(address=address)

            await self.muse.connect()

            self.address = address
            self.connected = True

            return True

        except Exception as e:
            print(f"Connection failed: {e}")
            self.muse = None
            self.connected = False
            return False


    async def disconnect(self):
        if self.muse:
            try:
                await self.muse.disconnect()
            except Exception:
                pass

        self.muse = None
        self.connected = False
        self.address = None


    def get_muse(self) -> MuseHeadset:
        if not self.connected or not self.muse:
            raise RuntimeError("No active Muse connection")
        
        return self.muse
    

    async def start_streaming_raw_telemetry(self):
        if not self.connected:
            raise RuntimeError("Not connected")

        if self.streaming:
            return

        def eeg_callback(data, timestamps):
            """
            data shape (Muse):
            typically (channels, samples)
            e.g. (5, N)
            """

        if not self.connected:
            raise RuntimeError("Not connected")

        if self.streaming:
            return

        def eeg_callback(data, timestamps):

            self.loop.call_soon_threadsafe(
                self.eeg_queue.put_nowait,
                {
                    "data": data.tolist(),
                    "timestamps": timestamps.tolist()
                }
            )

        self.muse.set_callback(eeg_callback)
        await self.muse.start()
        self.streaming = True

        print("Requested to start streaming raw telemetry")
    

    async def start_streaming_processed_signal(self):
        if not self.connected:
            raise RuntimeError("Not connected")

        if self.streaming:
            return

        def eeg_callback(data, timestamps):
            """
            data shape (Muse):
            typically (channels, samples)
            e.g. (5, N)
            """

            data = data.tolist()  # convert once

            num_samples = len(data[0])  # samples per channel

            for i in range(num_samples):
                # Build one sample across all channels
                sample = [data[ch][i] for ch in range(len(data))]

                result = self.processor.update(sample)

                if result is not None:
                    self.loop.call_soon_threadsafe(
                        self.eeg_queue.put_nowait,
                        result
                    )

        self.muse.set_callback(eeg_callback)
        await self.muse.start()
        self.streaming = True

        print("Requested to start streaming processed data")


    async def stop_streaming(self):
        print("Stopping streaming")

        if self.muse and self.streaming:
            await self.muse.stop()
            self.streaming = False


    async def get_eeg_data(self):
        return await self.eeg_queue.get()


__connection_manager = ConnectionManager()

def get_connection_manager():
    return __connection_manager