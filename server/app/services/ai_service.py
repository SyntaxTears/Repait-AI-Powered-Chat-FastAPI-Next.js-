import openai
import json
import os
import asyncio
from typing import List, Dict, Any, AsyncGenerator
# Logging replaced with print statements

# Configure OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY", "your-api-key-here")

async def generate_diagnostic(
    symptoms: str, 
    stream: bool = True
) -> AsyncGenerator[str, None]:
    """
    Generate a diagnostic result based on car symptoms or OBD codes.
    
    Args:
        symptoms: The symptoms or OBD codes described by the user
        stream: Whether to stream the response or return the full text
        
    Returns:
        If stream=True, yields chunks of the response
        If stream=False, returns the full response text
    """
    print(f"Starting diagnostic generation for symptoms: {symptoms}")
    print(f"Streaming mode: {stream}")
    
    prompt = f"""
    You are an expert automotive diagnostic AI. Analyze the following symptoms or OBD codes and provide a detailed diagnosis:
    
    {symptoms}
    
    Provide a thorough analysis including:
    1. Likely causes of the issue
    2. Severity level
    3. Recommended next steps
    4. Potential complications if left unaddressed
    """
    
    try:
        # Validate OpenAI API key
        if not openai.api_key:
            error_msg = "OpenAI API key is not set"
            print(f"[CRITICAL] {error_msg}")
            yield error_msg
            return
        
        print(f"[DEBUG] Preparing to call OpenAI API with prompt: {prompt[:100]}...")
        if stream:
            print("[DEBUG] Initiating streaming response")
            try:
                response = await openai.ChatCompletion.acreate(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an expert automotive diagnostic AI."},
                        {"role": "user", "content": prompt}
                    ],
                    stream=True
                )
            except Exception as init_error:
                print(f"[ERROR] Failed to initialize OpenAI API call: {init_error}")
                yield f"API initialization error: {init_error}"
                return
            
            print("[DEBUG] Streaming response started")
            current_chunk = ""
            chunk_count = 0
            try:
                async for chunk in response:
                    try:
                        if "content" in chunk.choices[0].delta:
                            content = chunk.choices[0].delta.content
                            current_chunk += content
                            # Yield when we have a meaningful chunk
                            if len(current_chunk) > 10:
                                print(f"[DEBUG] Yielding chunk {chunk_count}: {len(current_chunk)} characters")
                                yield current_chunk
                                chunk_count += 1
                                current_chunk = ""
                    except Exception as chunk_error:
                        print(f"[ERROR] Error processing individual chunk: {chunk_error}")
                
                # Yield any remaining content
                if current_chunk:
                    print(f"[DEBUG] Yielding final chunk: {len(current_chunk)} characters")
                    yield current_chunk
                
                print(f"[DEBUG] Total chunks yielded: {chunk_count}")
            except Exception as stream_error:
                print(f"[ERROR] Error during streaming response: {stream_error}")
                yield f"Streaming error: {stream_error}"
        else:
            print("[DEBUG] Generating full response")
            try:
                response = await openai.ChatCompletion.acreate(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an expert automotive diagnostic AI."},
                        {"role": "user", "content": prompt}
                    ]
                )
                
                full_result = response.choices[0].message.content
                print(f"[DEBUG] Full response generated: {len(full_result)} characters")
                yield full_result
            except Exception as full_response_error:
                print(f"[ERROR] Failed to generate full response: {full_response_error}")
                yield f"Response generation error: {full_response_error}"
    
    except openai.error.APIError as e:
        error_msg = f"[ERROR] OpenAI API error: {e}"
        print(error_msg)
        yield error_msg
    except openai.error.AuthenticationError as e:
        error_msg = f"[ERROR] Authentication error with OpenAI: {e}"
        print(error_msg)
        yield error_msg
    except openai.error.RateLimitError as e:
        error_msg = f"[ERROR] Rate limit exceeded: {e}"
        print(error_msg)
        yield error_msg
    except Exception as e:
        error_msg = f"[ERROR] Unexpected error in diagnostic generation: {e}"
        print(error_msg, exc_info=True)
        yield error_msg

async def predict_parts(diagnostic_result: str) -> List[Dict[str, Any]]:
    """
    Predict necessary parts based on a diagnostic result.
    
    Args:
        diagnostic_result: The diagnostic result text
        
    Returns:
        A list of dictionaries containing part information
    """
    prompt = f"""
    Based on the following car diagnostic result, predict the most likely parts that need to be replaced or repaired.
    For each part, provide a name, confidence level (as a decimal between 0 and 1), and estimated price range.
    
    Diagnostic Result:
    {diagnostic_result}
    
    Format your response as a JSON array with objects containing:
    - id (string)
    - name (string)
    - confidence (number between 0-1)
    - price (string with price range)
    """
    
    response = await openai.ChatCompletion.acreate(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an automotive parts prediction AI."},
            {"role": "user", "content": prompt}
        ]
    )
    
    try:
        parts = (response.choices[0].message.content).replace("```json", "").replace("```", "")
        parts = json.loads(parts)
    except json.JSONDecodeError:
        print(f"Error parsing parts: {response.choices[0].message.content}")
        return []
    print(f"Parts: {parts}")
    # Add unique IDs if not present
    for i, part in enumerate(parts):
        if "id" not in part:
            part["id"] = f"part_{i+1}"
    return parts

async def generate_repair_summary(
    diagnostic_result: str,
    parts: List[str],
    notes: str = None
) -> str:
    """
    Generate a customer-friendly repair summary.
    
    Args:
        diagnostic_result: The diagnostic result text
        parts: List of part names that need replacement
        notes: Additional notes from the technician
        
    Returns:
        A formatted repair summary
    """
    parts_text = ", ".join(parts) if parts else "No parts identified for replacement"
    notes_text = notes if notes else "No additional notes provided"
    
    prompt = f"""
    Create a clear, customer-friendly repair summary based on the following information:
    
    Diagnostic Result:
    {diagnostic_result}
    
    Parts to Replace:
    {parts_text}
    
    Additional Notes:
    {notes_text}
    
    The summary should:
    1. Explain the problem in simple terms
    2. List the parts that need replacement
    3. Explain why these repairs are necessary
    4. Include any additional notes from the technician
    5. Be professional but easy to understand for non-technical customers
    """
    
    response = await openai.ChatCompletion.acreate(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an automotive repair communication specialist."},
            {"role": "user", "content": prompt}
        ]
    )
    
    return response.choices[0].message.content
