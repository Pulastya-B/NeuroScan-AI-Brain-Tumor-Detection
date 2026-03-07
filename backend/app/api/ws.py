import asyncio
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ScanWebSocketManager:
    """
    Manages WebSocket connections keyed by scan_id.
    Background sync threads call notify_from_thread() to push status
    updates to all connected clients for a given scan without blocking.
    """

    def __init__(self):
        self.connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, scan_id: int, websocket: WebSocket):
        await websocket.accept()
        self.connections.setdefault(scan_id, set()).add(websocket)
        logger.info(f"WS connected for scan {scan_id} (total: {len(self.connections[scan_id])})")

    def disconnect(self, scan_id: int, websocket: WebSocket):
        conns = self.connections.get(scan_id)
        if conns:
            conns.discard(websocket)
            if not conns:
                del self.connections[scan_id]

    async def _broadcast(self, scan_id: int, data: dict):
        conns = list(self.connections.get(scan_id, set()))
        dead = []
        for ws in conns:
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.debug(f"WS send failed for scan {scan_id}: {e}")
                dead.append(ws)
        for ws in dead:
            self.disconnect(scan_id, ws)

    def notify_from_thread(self, scan_id: int, data: dict, loop: asyncio.AbstractEventLoop):
        """Thread-safe: schedule a broadcast from a sync background thread."""
        asyncio.run_coroutine_threadsafe(self._broadcast(scan_id, data), loop)


ws_manager = ScanWebSocketManager()
