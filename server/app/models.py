from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    sessions = relationship("Session", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    input_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="sessions")
    diagnostic_results = relationship("DiagnosticResult", back_populates="session")
    part_predictions = relationship("PartPrediction", back_populates="session")
    repair_notes = relationship("RepairNote", back_populates="session")
    repair_summaries = relationship("RepairSummary", back_populates="session")

class DiagnosticResult(Base):
    __tablename__ = "diagnostic_results"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    output_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("Session", back_populates="diagnostic_results")

class PartPrediction(Base):
    __tablename__ = "part_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    part_name = Column(String)
    confidence_score = Column(Float)
    selected = Column(Boolean, default=True)
    price_estimate = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("Session", back_populates="part_predictions")

class RepairNote(Base):
    __tablename__ = "repair_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    note_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("Session", back_populates="repair_notes")

class RepairSummary(Base):
    __tablename__ = "repair_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    summary_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("Session", back_populates="repair_summaries")
