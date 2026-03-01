from datetime import datetime
from pydantic import BaseModel
from typing import Any


class DeviceBase(BaseModel):
    name: str
    device_type: str = "other"
    room: str | None = None
    metadata: dict[str, Any] | None = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: str | None = None
    room: str | None = None
    is_online: bool | None = None
    metadata: dict[str, Any] | None = None


class DeviceResponse(DeviceBase):
    id: int
    user_id: int
    is_online: bool
    created_at: datetime

    class Config:
        from_attributes = True
