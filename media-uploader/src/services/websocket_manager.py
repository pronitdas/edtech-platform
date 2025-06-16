from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
import json
import asyncio
import logging
from datetime import datetime

# Optional Redis support
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self, redis_url: Optional[str] = None):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.channel_tasks: Dict[str, asyncio.Task] = {}
        
        # Initialize Redis if available and configured
        self.redis_client = None
        self.pubsub = None
        
        if REDIS_AVAILABLE and redis_url:
            try:
                self.redis_client = redis.from_url(redis_url)
                self.pubsub = self.redis_client.pubsub()
                logger.info("Redis WebSocket integration enabled")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. WebSocket will work without Redis.")
        
    async def connect(self, websocket: WebSocket, channel: str):
        """Connect a WebSocket to a channel."""
        await websocket.accept()
        
        if channel not in self.active_connections:
            self.active_connections[channel] = []
            
            # Subscribe to Redis channel if available
            if self.redis_client and self.pubsub:
                try:
                    await self._subscribe_to_redis_channel(channel)
                except Exception as e:
                    logger.warning(f"Failed to subscribe to Redis channel {channel}: {e}")
        
        self.active_connections[channel].append(websocket)
        logger.info(f"WebSocket connected to channel: {channel}")
        
        # Send initial connection confirmation
        await self.send_to_websocket(websocket, {
            "type": "connection_established",
            "channel": channel,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def disconnect(self, websocket: WebSocket, channel: str):
        """Disconnect a WebSocket from a channel."""
        if channel in self.active_connections:
            try:
                self.active_connections[channel].remove(websocket)
                logger.info(f"WebSocket disconnected from channel: {channel}")
            except ValueError:
                pass  # WebSocket was already removed
            
            # Clean up channel if no more connections
            if not self.active_connections[channel]:
                del self.active_connections[channel]
                
                # Unsubscribe from Redis and cancel listening task
                if channel in self.channel_tasks:
                    self.channel_tasks[channel].cancel()
                    del self.channel_tasks[channel]
                
                if self.pubsub:
                    try:
                        await self._unsubscribe_from_redis_channel(channel)
                    except Exception as e:
                        logger.warning(f"Failed to unsubscribe from Redis channel {channel}: {e}")

    async def send_to_channel(self, channel: str, message: Dict):
        """Send a message to all WebSockets in a channel."""
        if channel in self.active_connections:
            message_str = json.dumps(message)
            disconnected = []
            
            for websocket in self.active_connections[channel]:
                try:
                    await websocket.send_text(message_str)
                except WebSocketDisconnect:
                    disconnected.append(websocket)
                except Exception as e:
                    logger.warning(f"Failed to send message to WebSocket: {e}")
                    disconnected.append(websocket)
            
            # Remove disconnected WebSockets
            for ws in disconnected:
                try:
                    self.active_connections[channel].remove(ws)
                except ValueError:
                    pass

    async def send_to_websocket(self, websocket: WebSocket, message: Dict):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_text(json.dumps(message))
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.warning(f"Failed to send message to WebSocket: {e}")

    async def publish_status(self, channel: str, status: Dict):
        """Publish a status update to a channel (both Redis and direct WebSocket)."""
        # Send to local WebSocket connections
        await self.send_to_channel(channel, status)
        
        # Publish to Redis for other instances
        if self.redis_client:
            try:
                await self._publish_to_redis(channel, status)
            except Exception as e:
                logger.warning(f"Failed to publish to Redis channel {channel}: {e}")

    async def _subscribe_to_redis_channel(self, channel: str):
        """Subscribe to a Redis channel and start listening."""
        if not self.pubsub:
            return
        
        await self.pubsub.subscribe(channel)
        
        # Start listening task
        self.channel_tasks[channel] = asyncio.create_task(
            self._listen_for_redis_messages(channel)
        )

    async def _unsubscribe_from_redis_channel(self, channel: str):
        """Unsubscribe from a Redis channel."""
        if self.pubsub:
            await self.pubsub.unsubscribe(channel)

    async def _listen_for_redis_messages(self, channel: str):
        """Listen for messages from Redis and forward to WebSockets."""
        if not self.pubsub:
            return
        
        try:
            async for message in self.pubsub.listen():
                if message['type'] == 'message' and message['channel'].decode() == channel:
                    try:
                        data = json.loads(message['data'].decode())
                        await self.send_to_channel(channel, data)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON received from Redis channel {channel}")
                    except Exception as e:
                        logger.warning(f"Error processing Redis message: {e}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error listening to Redis channel {channel}: {e}")

    async def _publish_to_redis(self, channel: str, message: Dict):
        """Publish a message to Redis."""
        if self.redis_client:
            await self.redis_client.publish(channel, json.dumps(message))

    def get_channel_stats(self) -> Dict[str, int]:
        """Get statistics about active channels and connections."""
        return {
            channel: len(connections) 
            for channel, connections in self.active_connections.items()
        }

    async def broadcast_to_all(self, message: Dict):
        """Broadcast a message to all active channels."""
        for channel in list(self.active_connections.keys()):
            await self.send_to_channel(channel, message)

# Global WebSocket manager instance
websocket_manager = WebSocketManager()
