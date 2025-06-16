from fastapi import WebSocket
from typing import List, Dict
import json
import redis
import asyncio
from src.config import settings

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
        self.pubsub = self.redis_client.pubsub()
        
    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
            self.pubsub.subscribe(channel)
        self.active_connections[channel].append(websocket)
        
        # Start listening for Redis messages
        asyncio.create_task(self._listen_for_messages(channel))

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].remove(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]
                self.pubsub.unsubscribe(channel)

    async def send_message(self, message: str, channel: str):
        if channel in self.active_connections:
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(message)
                except:
                    self.active_connections[channel].remove(connection)

    async def _listen_for_messages(self, channel: str):
        while channel in self.active_connections:
            message = self.pubsub.get_message(timeout=1.0)
            if message and message['type'] == 'message':
                await self.send_message(message['data'].decode(), channel)
            await asyncio.sleep(0.1)

    def publish_status(self, channel: str, status: dict):
        self.redis_client.publish(channel, json.dumps(status))
