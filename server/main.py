import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from services.crc_service import crc_encode, crc_check
from services.hamming_service import hamming_encode, hamming_check

app = FastAPI(title="Error Detection & Correction Visualizer Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    data: str
    method: str # "crc" | "hamming"
    inject_error: bool = False
    # Additional parameters for CRC
    divisor: Optional[str] = "1011" # Standard CRC-3/4 divisor example

def flip_bit(binary_str: str) -> (str, int):
    """Flip a random bit in the binary string."""
    if not binary_str:
        return binary_str, -1
    pos = random.randint(0, len(binary_str) - 1)
    bits = list(binary_str)
    bits[pos] = "1" if bits[pos] == "0" else "0"
    return "".join(bits), pos

@app.get("/")
async def root():
    return {"message": "Welcome to Error Detection & Correction Visualizer API"}

@app.post("/simulate")
async def simulate(request: SimulationRequest):
    # Basic validation
    if not all(bit in "01" for bit in request.data):
        raise HTTPException(status_code=400, detail="Data must be a binary string.")
    
    if request.method.lower() == "crc":
        if not request.divisor or not all(bit in "01" for bit in request.divisor):
            raise HTTPException(status_code=400, detail="CRC Divisor must be a valid binary string.")
            
        # 1. Encode
        encoding_result = crc_encode(request.data, request.divisor)
        encoded_data = encoding_result["encoded"]
        
        # Format steps for frontend
        formatted_encoding_steps = []
        for i, step in enumerate(encoding_result["steps"]):
            formatted_encoding_steps.append({
                "title": f"Encoding Step {i+1}",
                "description": step,
                "bits": encoded_data if i == len(encoding_result["steps"]) - 1 else request.data + "0" * (len(request.divisor)-1),
                "highlight": []
            })
        
        # 2. Inject Noise
        transmitted_data = encoded_data
        error_pos = -1
        if request.inject_error:
            transmitted_data, error_pos = flip_bit(encoded_data)
            
        # 3. Check
        checking_result = crc_check(transmitted_data, request.divisor)
        
        formatted_checking_steps = []
        for i, step in enumerate(checking_result["steps"]):
            formatted_checking_steps.append({
                "title": f"Checking Step {i+1}",
                "description": step,
                "bits": transmitted_data,
                "highlight": [error_pos] if error_pos != -1 else []
            })
        
        return {
            "method": "CRC",
            "original_data": request.data,
            "divisor": request.divisor,
            "encoded_data": encoded_data,
            "transmitted_data": transmitted_data,
            "error_injected": request.inject_error,
            "error_pos": error_pos,
            "is_valid": checking_result["is_valid"],
            "remainder": checking_result["remainder"],
            "steps": {
                "encoding": formatted_encoding_steps,
                "checking": formatted_checking_steps
            }
        }
        
    elif request.method.lower() == "hamming":
        # 1. Encode
        encoding_result = hamming_encode(request.data)
        encoded_data = encoding_result["encoded"]
        
        formatted_encoding_steps = []
        for i, step in enumerate(encoding_result["steps"]):
            formatted_encoding_steps.append({
                "title": f"Hamming Encode Step {i+1}",
                "description": step,
                "bits": encoded_data,
                "highlight": []
            })
        
        # 2. Inject Noise
        transmitted_data = encoded_data
        error_pos = -1
        if request.inject_error:
            transmitted_data, error_pos = flip_bit(encoded_data)
            
        # 3. Check and Correct
        checking_result = hamming_check(transmitted_data)
        
        formatted_checking_steps = []
        for i, step in enumerate(checking_result["steps"]):
            formatted_checking_steps.append({
                "title": f"Hamming Check Step {i+1}",
                "description": step,
                "bits": transmitted_data,
                "highlight": [error_pos] if error_pos != -1 else []
            })
            
        return {
            "method": "Hamming",
            "original_data": request.data,
            "encoded_data": encoded_data,
            "transmitted_data": transmitted_data,
            "error_injected": request.inject_error,
            "error_pos": error_pos + 1 if error_pos != -1 else -1, # 1-based display
            "is_valid": checking_result["is_valid"],
            "corrected_encoded": checking_result["corrected_encoded"],
            "final_data": checking_result["data_only"],
            "steps": {
                "encoding": formatted_encoding_steps,
                "checking": formatted_checking_steps
            }
        }
        
    else:
        raise HTTPException(status_code=400, detail="Unsupported method. Use 'crc' or 'hamming'.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
