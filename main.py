from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from pathlib import Path
import json

# ============================================================
# SKY STREAM BACKEND
# ============================================================

app = FastAPI(title="Sky Stream Backend")

# ------------------------------------------------------------
# Paths
# ------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
CHANNELS_FILE = BASE_DIR / "channels.json"
TEMPLATES_DIR = BASE_DIR / "templates"

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


# ============================================================
# CHANNEL DATA
# ============================================================

def load_channels():
    """Load channels from channels.json."""

    if not CHANNELS_FILE.exists():
        CHANNELS_FILE.write_text(
            json.dumps([], indent=4),
            encoding="utf-8"
        )
        return []

    try:
        with open(CHANNELS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            return []

        return data

    except (json.JSONDecodeError, OSError):
        return []


def save_channels(channels):
    """Save channels to channels.json."""

    with open(CHANNELS_FILE, "w", encoding="utf-8") as file:
        json.dump(
            channels,
            file,
            indent=4,
            ensure_ascii=False
        )


# ============================================================
# MODELS
# ============================================================

class Channel(BaseModel):
    name: str
    category: str
    number: str
    streamUrl: str = ""


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
async def home():
    return {
        "status": "online",
        "name": "Sky Stream Backend",
        "version": "1.0",
        "endpoints": {
            "channels": "/api/channels",
            "admin": "/admin",
            "health": "/health"
        }
    }


@app.get("/health")
async def health():
    return {
        "status": "ok"
    }


# ============================================================
# CHANNEL API
# ============================================================

@app.get("/api/channels")
async def get_channels():
    """Return all channels."""

    return load_channels()


@app.get("/api/channels/{channel_number}")
async def get_channel(channel_number: str):
    """Return one channel by channel number."""

    channels = load_channels()

    for channel in channels:
        if str(channel.get("number", "")) == str(channel_number):
            return channel

    raise HTTPException(
        status_code=404,
        detail="Channel not found"
    )


@app.post("/api/channels")
async def add_channel(channel: Channel):
    """Add a new channel."""

    channels = load_channels()

    # Prevent duplicate channel numbers
    for existing in channels:
        if str(existing.get("number", "")) == str(channel.number):
            raise HTTPException(
                status_code=400,
                detail="A channel with this number already exists"
            )

    channels.append(channel.model_dump())

    save_channels(channels)

    return {
        "success": True,
        "message": "Channel added successfully",
        "channel": channel.model_dump()
    }


@app.put("/api/channels/{channel_number}")
async def update_channel(
    channel_number: str,
    channel: Channel
):
    """Update an existing channel."""

    channels = load_channels()

    found = False

    for index, existing in enumerate(channels):

        if str(existing.get("number", "")) == str(channel_number):

            channels[index] = channel.model_dump()

            found = True
            break

    if not found:
        raise HTTPException(
            status_code=404,
            detail="Channel not found"
        )

    save_channels(channels)

    return {
        "success": True,
        "message": "Channel updated successfully",
        "channel": channel.model_dump()
    }


@app.delete("/api/channels/{channel_number}")
async def delete_channel(channel_number: str):
    """Delete a channel."""

    channels = load_channels()

    new_channels = [
        channel
        for channel in channels
        if str(channel.get("number", "")) != str(channel_number)
    ]

    if len(new_channels) == len(channels):
        raise HTTPException(
            status_code=404,
            detail="Channel not found"
        )

    save_channels(new_channels)

    return {
        "success": True,
        "message": "Channel deleted successfully"
    }


# ============================================================
# ADMIN PANEL
# ============================================================

@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request):
    """
    Display the Sky Stream admin panel.

    IMPORTANT:
    This uses the current Starlette/FastAPI TemplateResponse
    syntax and fixes the tuple/dict error from the old syntax.
    """

    channels = load_channels()

    return templates.TemplateResponse(
        request=request,
        name="admin.html",
        context={
            "request": request,
            "channels": channels
        }
    )


# ============================================================
# ADMIN DATA ENDPOINT
# ============================================================

@app.get("/admin/channels")
async def admin_channels():
    """Return channels for the admin panel."""

    return load_channels()


# ============================================================
# STARTUP INFORMATION
# ============================================================

@app.on_event("startup")
async def startup_event():

    # Make sure channels.json exists
    if not CHANNELS_FILE.exists():

        default_channels = [
            {
                "name": "Sky News",
                "category": "News",
                "number": "101",
                "streamUrl": ""
            },
            {
                "name": "Sky Sports",
                "category": "Sports",
                "number": "102",
                "streamUrl": ""
            },
            {
                "name": "Sky Movies",
                "category": "Movies",
                "number": "103",
                "streamUrl": ""
            }
        ]

        save_channels(default_channels)

    # Make sure templates directory exists
    TEMPLATES_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print("")
    print("========================================")
    print("       SKY STREAM BACKEND")
    print("========================================")
    print("")
    print("Backend:")
    print("http://127.0.0.1:5000")
    print("")
    print("Channels API:")
    print("http://127.0.0.1:5000/api/channels")
    print("")
    print("Admin Panel:")
    print("http://127.0.0.1:5000/admin")
    print("")
    print("========================================")
    print("")
