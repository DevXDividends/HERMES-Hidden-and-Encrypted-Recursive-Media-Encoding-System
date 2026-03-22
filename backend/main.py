from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import encode, decode, keypair

app = FastAPI(title="HERMES API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(encode.router)
app.include_router(decode.router)
app.include_router(keypair.router)

@app.get("/")
def root():
    return {"message": "HERMES API is running", "version": "2.0.0"}