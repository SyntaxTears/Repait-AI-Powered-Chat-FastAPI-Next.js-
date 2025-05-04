from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
import json
import asyncio
import uvicorn
# Logging replaced with print statements

from app.models import User, Session as DiagnosticSession, DiagnosticResult, PartPrediction, RepairNote, RepairSummary
from app.database import get_db, engine, Base
from app.schemas import (
    UserCreate, UserResponse, SessionCreate, SessionResponse, 
    DiagnosticResultCreate, PartPredictionCreate, RepairNoteCreate, 
    RepairSummaryCreate, RepairSummaryResponse, Token, TokenData
)
from app.auth import (
    authenticate_user, create_access_token, get_password_hash, 
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user_from_token
)
from app.services.ai_service import (
    generate_diagnostic, predict_parts, generate_repair_summary
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Detect Auto API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connections
active_connections = {}

@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(email=user_data.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/sessions", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_session = DiagnosticSession(
        user_id=current_user.id,
        input_text=session_data.input_text
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return db_session


@app.get("/sessions")
async def get_diagnostic_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch all diagnostic sessions for the current user
    sessions = db.query(DiagnosticSession).filter(
        DiagnosticSession.user_id == current_user.id
    ).order_by(DiagnosticSession.created_at.desc()).all()
    
    return [{
        "session_id": session.id,
        "input_text": session.input_text,
        "created_at": session.created_at.isoformat()
    } for session in sessions]

@app.get("/sessions/{session_id}")
async def get_diagnostic_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch specific diagnostic session for the current user
    session = db.query(DiagnosticSession).filter(
        DiagnosticSession.id == session_id,
        DiagnosticSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Fetch all diagnostic results for this session
    diagnostic_results = db.query(DiagnosticResult).filter(
        DiagnosticResult.session_id == session_id
    ).all()
    
    # Fetch parts predictions
    parts = db.query(PartPrediction).filter(
        PartPrediction.session_id == session_id
    ).all()
    
    # Fetch repair summary
    summary = db.query(RepairSummary).filter(
        RepairSummary.session_id == session_id
    ).first()
    
    return {
        "session_id": session.id,
        "input_text": session.input_text,
        "diagnostic_results": [
            {
                "input_message": result.input_message,  
                "output_text": result.output_text
            } for result in diagnostic_results
        ] if diagnostic_results else [],
        "parts": [{
            "id": part.id,
            "name": part.part_name,
            "confidence": part.confidence_score,
            "price": part.price_estimate
        } for part in parts],
        "summary": summary.summary_text if summary else None,
        "created_at": session.created_at.isoformat()
    }

@app.post("/diagnostic/start")
async def start_diagnostic_session(
    input_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create a new diagnostic session
    session = DiagnosticSession(
        user_id=current_user.id,
        input_text=input_data.get('input', '')
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "session_id": session.id,
        "input_text": session.input_text,
        "created_at": session.created_at
    }


@app.websocket("/ws/diagnostics/{session_id}")
async def diagnostic_websocket(
    websocket: WebSocket, 
    session_id: int, 
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Validate token from query parameters
    print(f"Token: {token}")
    token = token or websocket.query_params.get('token')
    print(f"Token: {token}")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="No authentication token")
        return
    
    try:
        # Validate token and get user
        user = get_current_user_from_token(token, db)
        
        # Check if session exists and belongs to user
        session = db.query(DiagnosticSession).filter(
            DiagnosticSession.id == session_id,
            DiagnosticSession.user_id == user.id
        ).first()
        
        if not session:
            # Create new session if not exists
            session = DiagnosticSession(user_id=user.id)
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Accept WebSocket connection AFTER validation
        print("Accepting WebSocket connection")
        await websocket.accept()
        print("WebSocket accepted")
        # Add to active connections
        if user.id not in active_connections:
            active_connections[user.id] = set()
        active_connections[user.id].add(websocket)
        
        # Send initial session information
        await websocket.send_text(json.dumps({"session_id": session.id}))
        
        # Handle messages
        print("Handling messages")
        while True:
            try:
                print("Receiving message")
                data = await websocket.receive_text()
                print(f"Received message: {data}")
                message = json.loads(data)
                
                if "input" in message:
                    user_input = message["input"]
                    
                    # Update session input
                    session.input_text = user_input
                    db.commit()
                    
                    # Generate diagnostic in chunks
                    try:
                        print(f"Starting diagnostic generation for session {session_id}")
                        print(f"User input: {user_input}")

                        # Collect chunks for final result
                        full_result_chunks = []
                        chunk_count = 0
                        
                        print("Calling generate_diagnostic...")
                        diagnostic_generator = generate_diagnostic(user_input)
                        print("Diagnostic generator created")
                        
                        try:
                            async for chunk in diagnostic_generator:
                                print(f"Chunk received: {chunk}")
                                if chunk:  # Only send non-empty chunks
                                    print(f"Processing chunk {chunk_count}: {len(chunk)} characters")
                                    full_result_chunks.append(chunk)
                                    try:
                                        await websocket.send_text(json.dumps({"chunk": chunk}))
                                        chunk_count += 1
                                    except Exception as send_error:
                                        print(f"Error sending chunk: {send_error}")
                        except Exception as generator_error:
                            print(f"Generator error: {generator_error}")
                        
                        # Combine chunks into full result
                        full_result = ''.join(full_result_chunks)
                        print(f"Total chunks received: {chunk_count}, Full result length: {len(full_result)} characters")
                        
                        # Save final diagnostic result
                        try:
                            diagnostic_result = DiagnosticResult(
                                session_id=session.id,
                                input_message=user_input,  # Store input message
                                output_text=full_result
                            )
                            db.add(diagnostic_result)
                            db.commit()
                            print(f"Diagnostic result saved for session {session_id}")
                        except Exception as db_error:
                            print(f"Database save error: {db_error}")
                        
                        # Send completion message
                        try:
                            await websocket.send_text(json.dumps({"complete": True, "result": full_result}))
                            print(f"Diagnostic generation complete for session {session_id}")
                        except Exception as completion_error:
                            print(f"Error sending completion message: {completion_error}")
                    except Exception as gen_error:
                        print(f"Diagnostic generation error for session {session_id}: {gen_error}")
                        try:
                            await websocket.send_text(json.dumps({"error": f"Diagnostic generation failed: {str(gen_error)}"}))
                        except Exception as send_error:
                            print(f"Error sending error message: {send_error}")
                else:
                    await websocket.send_text(json.dumps({"error": "Invalid message format"}))
            
            except json.JSONDecodeError as json_error:
                print(f"WebSocket: Invalid JSON - {json_error}")
                try:
                    await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
                except Exception as send_error:
                    print(f"Error sending invalid JSON error: {send_error}")
            
            except WebSocketDisconnect:
                print(f"WebSocket disconnected for session {session_id}")
                break
            
            except Exception as unexpected_error:
                print(f"Unexpected WebSocket error: {unexpected_error}")
                try:
                    await websocket.send_text(json.dumps({"error": f"Unexpected error: {str(unexpected_error)}"}))
                except Exception as send_error:
                    print(f"Error sending unexpected error message: {send_error}")
                break
            except Exception as e:
                print(f"WebSocket message handling error: {e}")
                await websocket.send_text(json.dumps({"error": str(e)}))
    
    except Exception as e:
        print(f"WebSocket global error: {str(e)}")
        try:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=str(e))
        except:
            pass
    finally:
        # Cleanup
        try:
            if 'user' in locals() and user.id in active_connections and 'websocket' in locals():
                active_connections[user.id].discard(websocket)
        except:
            pass

@app.post("/predict-parts")
async def predict_parts_endpoint(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get session and diagnostic result
    session = db.query(DiagnosticSession).filter(
        DiagnosticSession.id == session_id,
        DiagnosticSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    diagnostic_result = db.query(DiagnosticResult).filter(
        DiagnosticResult.session_id == session_id
    ).first()
    
    if not diagnostic_result:
        raise HTTPException(status_code=404, detail="Diagnostic result not found")
    
    # Predict parts
    parts = await predict_parts(diagnostic_result.output_text)
    
    # Save predictions to database
    db_parts = []
    for part in parts:
        db_part = PartPrediction(
            session_id=session_id,
            part_name=part["name"],
            confidence_score=part["confidence"],
            price_estimate=part["price"]
        )
        db.add(db_part)
        db_parts.append(db_part)
    
    db.commit()
    
    # Return parts with database IDs
    for i, part in enumerate(parts):
        part["id"] = db_parts[i].id
    
    return parts

@app.post("/summarize-order", response_model=RepairSummaryResponse)
async def summarize_order(
    session_id: int,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get session, diagnostic result and parts
    session = db.query(DiagnosticSession).filter(
        DiagnosticSession.id == session_id,
        DiagnosticSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    diagnostic_result = db.query(DiagnosticResult).filter(
        DiagnosticResult.session_id == session_id
    ).first()
    
    if not diagnostic_result:
        raise HTTPException(status_code=404, detail="Diagnostic result not found")
    
    parts = db.query(PartPrediction).filter(
        PartPrediction.session_id == session_id
    ).all()
    
    # Save notes if provided
    if notes:
        repair_note = RepairNote(
            session_id=session_id,
            note_text=notes
        )
        db.add(repair_note)
        db.commit()
    
    # Generate summary
    parts_list = [part.part_name for part in parts]
    summary_text = await generate_repair_summary(
        diagnostic_result.output_text,
        parts_list,
        notes
    )
    
    # Save summary
    summary = RepairSummary(
        session_id=session_id,
        summary_text=summary_text
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    
    return summary

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
