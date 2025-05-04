from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Session schemas
class SessionBase(BaseModel):
    input_text: Optional[str] = None

class SessionCreate(SessionBase):
    pass

class SessionResponse(SessionBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Diagnostic result schemas
class DiagnosticResultBase(BaseModel):
    output_text: str

class DiagnosticResultCreate(DiagnosticResultBase):
    session_id: int

class DiagnosticResultResponse(DiagnosticResultBase):
    id: int
    session_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Part prediction schemas
class PartPredictionBase(BaseModel):
    part_name: str
    confidence_score: float
    selected: bool = True
    price_estimate: Optional[str] = None

class PartPredictionCreate(PartPredictionBase):
    session_id: int

class PartPredictionResponse(PartPredictionBase):
    id: int
    session_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Repair note schemas
class RepairNoteBase(BaseModel):
    note_text: str

class RepairNoteCreate(RepairNoteBase):
    session_id: int

class RepairNoteResponse(RepairNoteBase):
    id: int
    session_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Repair summary schemas
class RepairSummaryBase(BaseModel):
    summary_text: str

class RepairSummaryCreate(RepairSummaryBase):
    session_id: int

class RepairSummaryResponse(RepairSummaryBase):
    id: int
    session_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
