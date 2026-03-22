from fastapi import APIRouter
from fastapi.responses import JSONResponse
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crypto import generate_keypair

router = APIRouter(prefix="/api", tags=["keypair"])

@router.post("/generate-keypair")
def generate_keypair_endpoint():
    try:
        private_pem, public_pem = generate_keypair()
        return JSONResponse({
            "private_pem": private_pem.decode("utf-8"),
            "public_pem": public_pem.decode("utf-8"),
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})