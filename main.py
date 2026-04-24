import asyncio
from bleak import BleakScanner, BleakClient

MUSE_EEG_UUIDS = [
    "273e0003-4c4d-454d-96be-f03bac821358",
    "273e0004-4c4d-454d-96be-f03bac821358",
    "273e0005-4c4d-454d-96be-f03bac821358",
    "273e0006-4c4d-454d-96be-f03bac821358",
    "273e0007-4c4d-454d-96be-f03bac821358",
]

CONTROL_UUID = "273e0001-4c4d-454d-96be-f03bac821358"

def handle_data(sender, data):
    print(f"[{sender}] {len(data)} bytes: {data[:10]}...")

async def find_muse():
    print("Scanning for devices...")
    devices = await BleakScanner.discover()

    for d in devices:
        if d.name and "Muse" in d.name:
            print(f"Found Muse device: {d.name} ({d.address})")
            return d

    print("No Muse device found")
    return None


async def main():
    device = await find_muse()
    if not device:
        return

    async with BleakClient(device.address) as client:
        print("Connected:", client.is_connected)

        print("\nServices + Characteristics:")
        for service in client.services:
            print(f"[Service] {service.uuid}")
            for char in service.characteristics:
                print(f"  └── {char.uuid} (notify={char.properties})")

        print("\nTrying to subscribe to EEG channels...")

        subscribed = False

        for uuid in MUSE_EEG_UUIDS:
            try:
                await client.start_notify(uuid, handle_data)
                print(f"Subscribed to {uuid}")
                subscribed = True
            except Exception as e:
                print(f"Could not subscribe to {uuid}: {e}")

        if not subscribed:
            print("\nCould not subscribe to known Muse EEG UUIDs.")
            print("Trying all NOTIFY characteristics instead...\n")

            for service in client.services:
                for char in service.characteristics:
                    if "notify" in char.properties:
                        try:
                            await client.start_notify(char.uuid, handle_data)
                            print(f"Subscribed to {char.uuid}")
                            subscribed = True
                        except Exception:
                            pass

        if not subscribed:
            print("No characteristics could be subscribed to.")
            return

        # Send start command to the headset
        await client.write_gatt_char(
            CONTROL_UUID,
            bytearray([0x02, 0x64, 0x0a]),
            response=False
        )

        print("Sent start command to the headset")

        print("\nStreaming data... (Ctrl+C to stop)")
        while True:
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())