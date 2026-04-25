import threading
import asyncio

from Muse import Muse
from EEGVisualiser import EEGVisualizer

stop_event = threading.Event()
visualizer = EEGVisualizer()

def on_close(event):
    stop_event.set()

visualizer.fig.canvas.mpl_connect('close_event', on_close)


def run_ble_loop(visualizer: EEGVisualizer, stop_event: threading.Event):
    async def ble_main():
        muse = Muse(callback=visualizer.update_data)

        await muse.connect()
        await muse.start()

        try:
            while not stop_event.is_set():
                await asyncio.sleep(1)

        finally:
            print("Stopping the Muse Headset...")
            try:
                await muse.stop()
            except Exception as e:
                print("Stop error:", e)

            try:
                await muse.disconnect()
            except Exception as e:
                print("Disconnect error:", e)

            print("Disconnected cleanly")

    asyncio.run(ble_main())


# Start BLE in background thread
muse_thread = threading.Thread(
    target=run_ble_loop,
    args=(visualizer, stop_event),
)
muse_thread.start()

visualizer.start()

muse_thread.join()


