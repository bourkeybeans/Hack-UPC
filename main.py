import asyncio
from Muse import Muse

def print_eeg(data, timestamps):
    print("EEG frame:")
    print("Shape:", data.shape)   # (5 channels, 12 samples)
    print("First channel:", data[0][:12])
    print("----")


async def main():
    muse = Muse(callback=print_eeg)

    await muse.connect()
    await muse.start()

    try:
        while True:
            await asyncio.sleep(1)

    except:
        print("Stopping...")
        await muse.stop()
        await muse.disconnect()


asyncio.run(main())