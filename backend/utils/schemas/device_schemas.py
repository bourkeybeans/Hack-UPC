from pydantic import BaseModel

class ConnectRequest(BaseModel):
    """
    Schema for a device connection request
    """

    address: str


class ConnectionStatus(BaseModel):
    """
    Schema for representing the current connection status
    """

    isConnected: bool
    address: str | None


class DeviceInfo(BaseModel):
    """
    Schema for representing device info
    """

    name: str
    address: str
