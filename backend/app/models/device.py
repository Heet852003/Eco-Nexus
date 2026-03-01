"""IoT device model."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class DeviceType(str, enum.Enum):
    THERMOSTAT = "thermostat"
    LIGHT = "light"
    SENSOR = "sensor"
    PLUG = "plug"
    LOCK = "lock"
    CAMERA = "camera"
    SPEAKER = "speaker"
    OTHER = "other"


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    device_type = Column(String(32), nullable=False, default=DeviceType.OTHER.value)
    room = Column(String(128), nullable=True)
    is_online = Column(Boolean, default=True)
    metadata_ = Column("metadata", JSON, nullable=True)  # vendor, firmware, capabilities
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Optional: relationship for ORM
    # user = relationship("User", back_populates="devices")
