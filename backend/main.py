from fastapi import FastAPI

app = FastAPI(title="VibeBuild API", description="Backend for VibeBuild Hackathon Platform")

@app.get("/")
def read_root():
    return {"message": "Welcome to VibeBuild API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
