from fastapi import APIRouter
from bleak import BleakScanner

router = APIRouter()

@router.get("/")
def health_check():

    return "Devices service is healthy!"


@router.get("/discover-devices")
async def discover_devices():
    devices = await BleakScanner.discover()

    muse_devices = [
        {
            "name": d.name,
            "address": d.address
        }
        for d in devices
        if d.name and "Muse" in d.name
    ]

    return muse_devices