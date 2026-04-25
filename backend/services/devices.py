from fastapi import APIRouter, Depends, HTTPException
from bleak import BleakScanner
from typing import List

from utils.muse.ConnectionManager import get_connection_manager
from utils.schemas.device_schemas import ConnectRequest, ConnectionStatus, DeviceInfo

router = APIRouter()


def require_connection(manager = Depends(get_connection_manager)):
    """
    Dependency that enforces a valid device connection before endpoint is accessed
    """

    if not manager.connected:
        raise HTTPException(status_code=400, detail="No device connected")
    
    return manager


@router.get("/")
def health_check() -> str:
    """
    Returns a health check on the devices service

    :returns str: The health check message
    """

    return "Devices service is healthy!"


@router.get("/discover-devices")
async def discover_devices() -> List[DeviceInfo]:
    """
    Discovers Muse devices that are available for connection

    :returns devices: A list of all available Muse devices that can be connected to
    """

    devices = await BleakScanner.discover()

    muse_devices = [
        DeviceInfo(name=d.name, address=d.address)
        for d in devices
        if d.name and "Muse" in d.name
    ]

    return muse_devices


@router.post("/connect")
async def connect_device(request: ConnectRequest) -> ConnectionStatus:
    """
    Connect to a specific device

    :param request: The request containing the address of the device to connect to
    :returns status: The connection status of the connected device
    """

    manager = get_connection_manager()

    if manager.connected:
        raise HTTPException(
            status_code=400,
            detail=f"Already connected to {manager.address}"
        )

    success = await get_connection_manager().connect(request.address)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to connect")

    return ConnectionStatus(isConnected=True, address=request.address)


@router.post("/disconnect")
async def disconnect(manager = Depends(require_connection)) -> ConnectionStatus:
    """
    Disconnects from the currently connected device.
    Must be connected to a device to access sucessfully

    :returns status: The connection status after disconnecting
    """

    await manager.disconnect()

    return ConnectionStatus(isConnected=False, address="")


@router.get("/connection-status")
def connection_status() -> ConnectionStatus:
    """
    Gets the current connection status to a device
    
    :returns status: The current connection status
    """

    manager = get_connection_manager()

    return ConnectionStatus(isConnected=manager.connected, address=manager.address)