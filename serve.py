#!/usr/bin/env python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from dotenv import load_dotenv

# 1. Load the environment variables
load_dotenv()

# 4. Server side app definition

# Using FastAPI to create an Rest API server for calling the agent
app = FastAPI(
  title="Custom Agentforce Chatbot UX",
  version="1.0",
  description="A simple web server to host a simple chatbot",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Serve out static content (our web app)
app.mount("/public", StaticFiles(directory="public"), name="public")

@app.get("/index.html")
async def redirect_typer1():
    return RedirectResponse("/public/index.html")

@app.get("/favicon.ico")
async def redirect_typer2():
    return RedirectResponse("/public/favicon.ico")

@app.get("/")
async def redirect_typer3():
    return RedirectResponse("/public/index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)