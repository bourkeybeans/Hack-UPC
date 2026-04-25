from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.muse.ConnectionManager import get_connection_manager

router = APIRouter()

@router.websocket("/stream")
async def eeg_stream(websocket: WebSocket):
    await websocket.accept()

    manager = get_connection_manager()

    if not manager.connected:
        await websocket.send_json({"error": "No device connected"})
        await websocket.close()
        return

    try:
        await manager.start_streaming()

        while True:
            data = await manager.get_eeg_data()

            await websocket.send_json({
                "eeg": data
            })

    except WebSocketDisconnect:
        print("Client disconnected")

    except Exception as e:
        print(f"Streaming error: {e}")

    finally:
        await manager.stop_streaming()