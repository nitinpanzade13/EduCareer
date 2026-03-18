from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os

app = FastAPI()

# --- CONFIGURATION: GPU ENABLED ---
MODEL_ID = "./models/gemma-2-2b-it"

# Print Startup Info
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🖥️  System detected: {device.upper()} (RTX 3050 Optimized)")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, local_files_only=True)
    
    # "auto" is perfect for your 6GB card. It fills the GPU, then spills to RAM if needed.
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        device_map="auto",          # <--- IMPORTANT: Uses GPU
        torch_dtype=torch.float16,  # <--- IMPORTANT: Uses less memory
        local_files_only=True
    )
    print("✅ Model loaded successfully on NVIDIA GPU!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

class PromptRequest(BaseModel):
    prompt: str
    max_tokens: int = 200

@app.post("/generate")
async def generate_text(request: PromptRequest):
    try:
        chat = [{"role": "user", "content": request.prompt}]
        prompt_text = tokenizer.apply_chat_template(chat, tokenize=False, add_generation_prompt=True)

        inputs = tokenizer.encode(prompt_text, return_tensors="pt").to(model.device)

        outputs = model.generate(
            inputs, 
            max_new_tokens=request.max_tokens,
            do_sample=True,
            temperature=0.7
        )

        decoded_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response_text = decoded_output.replace(prompt_text, "").strip()
        
        if "model" in response_text:
            response_text = response_text.split("model")[-1].strip()

        return {"response": response_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))