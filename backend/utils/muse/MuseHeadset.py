import asyncio
import bitstring
import numpy as np
from time import time
from bleak import BleakClient, BleakScanner
from typing import Optional
from utils.muse.BrainPipeline import BrainPipeline


MUSE_SERVICE = "0000fe8d-0000-1000-8000-00805f9b34fb"

EEG_UUIDS = [
    "273e0003-4c4d-454d-96be-f03bac821358",
    "273e0004-4c4d-454d-96be-f03bac821358",
    "273e0005-4c4d-454d-96be-f03bac821358",
    "273e0006-4c4d-454d-96be-f03bac821358",
    "273e0007-4c4d-454d-96be-f03bac821358",
]

CONTROL_UUID = "273e0001-4c4d-454d-96be-f03bac821358"


class MuseHeadset:
    def __init__(self, address=None, callback=None, name=None, time_func=time):
        self.address = address
        self.name = name
        self.callback = callback
        self.time_func = time_func
        self.client = None

        # EEG state
        self._init_sample()
        self._init_timestamp_correction()
        self.last_tm = 0

        # Index of UUID's
        self.uuid_to_index = {uuid: i for i, uuid in enumerate(EEG_UUIDS)}


    async def discover_headset(self) -> Optional[str]:
        """
        Finds available Muse devices to connect to

        :returns address: The address of the muse headset available
        """

        devices = await BleakScanner.discover()

        for d in devices:
            if self.name:
                if d.name == self.name:
                    print(f"Found {d.name} ({d.address})")
                    return d.address
                
            elif d.name and "Muse" in d.name:
                print(f"Found {d.name} ({d.address})")
                return d.address

        return None


    async def connect(self):
        """
        Connects to the muse headset

        :raises ValueError: If the headset cannot be found
        """

        print("Attempting to connect to the Muse headset")

        if self.address is None:
            self.address = await self.discover_headset()
            if self.address is None:
                raise ValueError("Can't find Muse device")

        self.client = BleakClient(self.address)
        await self.client.connect()
        print(f"Connected: {self.client.is_connected}")

        # Subscribe to all EEG channels
        for uuid in EEG_UUIDS:
            await self.client.start_notify(uuid, self._handle_eeg)


    async def start(self):
        """
        Starts the Muse device streaming data
        """

        self._init_timestamp_correction()
        self._init_sample()
        self.last_tm = 0

        # Allow a second for BLE to initialise
        await asyncio.sleep(0.5)

        # Send start signal to the headset
        await self.client.write_gatt_char(
            CONTROL_UUID,
            bytearray([0x02, 0x64, 0x0a]),
            response=False
        )

        print("Headset instructed to start streaming")


    async def stop(self):
        """
        Stops the headset from streaming data
        """

        # Send stop signal to the headset
        await self.client.write_gatt_char(
            CONTROL_UUID,
            bytearray([0x02, 0x68, 0x0a]),
            response=False
        )

        print("Stop command sent to headset")


    async def disconnect(self):
        """
        Disconnects from the Muse headset
        """

        await self.client.disconnect()

        print("Successfully disconnected from the headset")


    def _unpack_eeg_channel(self, packet):
        """
        Decodes an EEG packet from a single channel

        Packet format:
        First 16 bits - a 16-bit timestamp
        Next 144 bits - 12 12-bit resolution time-series samples

        :param packet: The data packet to decode
        """

        aa = bitstring.Bits(bytes=packet)
        pattern = "uint:16,uint:12,uint:12,uint:12,uint:12,uint:12,uint:12, \
                   uint:12,uint:12,uint:12,uint:12,uint:12,uint:12"
        res = aa.unpack(pattern)
        packetIndex = res[0]
        data = np.array(res[1:])
        
        # 12 bits on a 2 mVpp range
        data = 0.48828125 * (data - 2048)
        return packetIndex, data


    def _init_sample(self):
        """
        Initialise an array to store the samples in
        """

        self.timestamps = np.zeros(5)
        self.data = np.zeros((5, 12))


    def _init_timestamp_correction(self):
        """
        Initialise the timestamp parameters
        """

        self.sample_index = 0
        self.reg_params = np.array([self.time_func(), 1.0 / 256])


    def _handle_eeg(self, sender, data):
        """
        Callback function for recieving a sample from the headset
        
        :param sender: The details of the sender of the data
        :param data: The raw data recieved
        """

        timestamp = self.time_func()

        sender_uuid = str(sender).split()[0]

        if sender_uuid not in self.uuid_to_index:
            return

        index = self.uuid_to_index[sender_uuid]

        tm, d = self._unpack_eeg_channel(data)

        if self.last_tm == 0:
            self.last_tm = tm - 1

        self.data[index] = d
        self.timestamps[index] = timestamp

        # last packet (channel 5 equivalent)
        if sender_uuid == EEG_UUIDS[-1]:
            if tm != self.last_tm + 1:
                print(f"Missing sample {tm} : {self.last_tm}")

            self.last_tm = tm

            idxs = np.arange(0, 12) + self.sample_index
            self.sample_index += 12

            timestamps = self.reg_params[1] * idxs + self.reg_params[0]

            if self.callback:
                self.callback(self.data.copy(), timestamps.copy())

            self._init_sample()


    def set_callback(self, callback) -> None:
        self.callback = callback