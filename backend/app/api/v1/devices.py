"""Devices CRUD — IoT device management."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession, CurrentUser
from app.core.cache import cache_get, cache_set, cache_delete
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse

router = APIRouter(prefix="/devices", tags=["devices"])


def _device_response(d: Device) -> DeviceResponse:
    return DeviceResponse(
        id=d.id,
        user_id=d.user_id,
        name=d.name,
        device_type=d.device_type,
        room=d.room,
        is_online=d.is_online,
        metadata=d.metadata_ or {},
        created_at=d.created_at,
    )


@router.get("", response_model=list[DeviceResponse])
async def list_devices(
    user: CurrentUser,
    db: DbSession,
    room: str | None = Query(None),
    device_type: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[DeviceResponse]:
    cache_key = f"devices:list:{user.id}:{room}:{device_type}:{skip}:{limit}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return [DeviceResponse(**x) for x in cached]
    q = select(Device).where(Device.user_id == user.id)
    if room:
        q = q.where(Device.room == room)
    if device_type:
        q = q.where(Device.device_type == device_type)
    q = q.offset(skip).limit(limit).order_by(Device.created_at.desc())
    result = await db.execute(q)
    devices = result.scalars().all()
    out = [_device_response(d) for d in devices]
    await cache_set(cache_key, [r.model_dump(mode="json") for r in out])
    return out


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(
    data: DeviceCreate,
    user: CurrentUser,
    db: DbSession,
) -> Device:
    device = Device(
        user_id=user.id,
        name=data.name,
        device_type=data.device_type,
        room=data.room,
        metadata_=data.metadata,
    )
    db.add(device)
    await db.flush()
    await db.refresh(device)
    await cache_delete(f"devices:list:{user.id}:")
    return _device_response(device)


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: int,
    user: CurrentUser,
    db: DbSession,
) -> Device:
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return _device_response(device)


@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: int,
    data: DeviceUpdate,
    user: CurrentUser,
    db: DbSession,
) -> Device:
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if data.name is not None:
        device.name = data.name
    if data.room is not None:
        device.room = data.room
    if data.is_online is not None:
        device.is_online = data.is_online
    if data.metadata is not None:
        device.metadata_ = data.metadata
    await db.flush()
    await db.refresh(device)
    await cache_delete(f"devices:list:{user.id}:")
    return _device_response(device)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: int,
    user: CurrentUser,
    db: DbSession,
) -> None:
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.delete(device)
    await cache_delete(f"devices:list:{user.id}:")
    return None
