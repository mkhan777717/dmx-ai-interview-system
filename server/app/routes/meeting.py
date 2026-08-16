"""
meeting.py — WebSocket-based real-time meeting co-pilot endpoint

WS  /api/meeting/ws/{session_id}
GET /api/meeting/sessions           — list active sessions
DEL /api/meeting/sessions/{sid}     — remove a session

WebSocket message protocol (client → server):
  { "type": "ping" }
  { "type": "utterance",  "speaker": "candidate|ai", "text": "..." }
  { "type": "query",      "text": "...", "image_b64": null, "image_mime": "image/jpeg",
                          "force": false }
  { "type": "screenshot", "data": "<b64 JPEG>", "question": "What is on screen?" }
  { "type": "webcam",     "data": "<b64 JPEG>", "question": "What does the candidate look like?" }
  { "type": "clear" }

WebSocket message protocol (server → client):
  { "type": "pong" }
  { "type": "response",  "text": "...", "speak": true, "addressed": true }
  { "type": "context",   "entries": [...], "count": N }
  { "type": "error",     "message": "..." }
  { "type": "ack",       "action": "utterance_added" }
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from app.services.address_detector import detect_address_async
from app.services.meeting_context import (
    get_or_create_session,
    list_sessions,
    remove_session,
)
from app.services.openrouter_service import meeting_reply

log = logging.getLogger("meeting_ws")
router = APIRouter()


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/{session_id}")
async def meeting_ws(ws: WebSocket, session_id: str):
    await ws.accept()
    log.info("Meeting WS connected: %s", session_id)

    buf = get_or_create_session(session_id)
    avatar_name = "Alex"   # default; client can override via a future config frame

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await _send(ws, {"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = msg.get("type", "")

            # ── Ping / keep-alive ─────────────────────────────────────────
            if msg_type == "ping":
                await _send(ws, {"type": "pong"})

            # ── Add utterance to context buffer ───────────────────────────
            elif msg_type == "utterance":
                speaker = msg.get("speaker", "candidate")
                text    = (msg.get("text") or "").strip()
                if text:
                    buf.add(speaker, text)
                    await _send(ws, {
                        "type":   "ack",
                        "action": "utterance_added",
                        "count":  len(buf),
                    })

            # ── Direct AI query (explicit) ────────────────────────────────
            elif msg_type == "query":
                text      = (msg.get("text") or "").strip()
                image_b64 = msg.get("image_b64") or None
                image_mime = msg.get("image_mime") or "image/jpeg"
                force     = bool(msg.get("force", False))

                if not text:
                    await _send(ws, {"type": "error", "message": "Empty query text"})
                    continue

                # Check direct-address unless force=true (Ctrl+Space override)
                if not force:
                    result = await detect_address_async(text, avatar_name)
                    if not result.addressed:
                        # Still record utterance but don't respond
                        buf.add("candidate", text)
                        await _send(ws, {
                            "type":      "ack",
                            "action":    "not_addressed",
                            "trigger":   result.trigger,
                            "confidence": result.confidence,
                        })
                        continue

                # Generate AI response
                try:
                    response_text = await meeting_reply(
                        query=text,
                        context_prompt=buf.get_context_prompt(),
                        avatar_name=avatar_name,
                        image_b64=image_b64,
                        image_mime=image_mime,
                    )
                    buf.add("candidate", text)
                    buf.add("ai", response_text)
                    await _send(ws, {
                        "type":      "response",
                        "text":      response_text,
                        "speak":     True,
                        "addressed": True,
                    })
                except Exception as exc:
                    log.error("AI query failed: %s", exc)
                    await _send(ws, {
                        "type":    "error",
                        "message": f"AI unavailable: {str(exc)[:120]}",
                    })

            # ── Screenshot analysis ───────────────────────────────────────
            elif msg_type == "screenshot":
                b64      = msg.get("data") or ""
                question = (msg.get("question") or "What is visible on this screen?").strip()
                if not b64:
                    await _send(ws, {"type": "error", "message": "No image data"})
                    continue
                try:
                    response_text = await meeting_reply(
                        query=question,
                        context_prompt=buf.get_context_prompt(),
                        avatar_name=avatar_name,
                        image_b64=b64,
                        image_mime="image/jpeg",
                    )
                    buf.add("ai", f"[Screen] {response_text}")
                    await _send(ws, {
                        "type":  "response",
                        "text":  response_text,
                        "speak": True,
                        "source": "screen",
                    })
                except Exception as exc:
                    log.error("Screenshot analysis failed: %s", exc)
                    await _send(ws, {"type": "error", "message": str(exc)[:120]})

            # ── Webcam frame analysis ─────────────────────────────────────
            elif msg_type == "webcam":
                b64      = msg.get("data") or ""
                question = (msg.get("question") or "What can you see in this webcam frame?").strip()
                if not b64:
                    await _send(ws, {"type": "error", "message": "No webcam image data"})
                    continue
                try:
                    response_text = await meeting_reply(
                        query=question,
                        context_prompt=buf.get_context_prompt(),
                        avatar_name=avatar_name,
                        image_b64=b64,
                        image_mime="image/jpeg",
                    )
                    buf.add("ai", f"[Webcam] {response_text}")
                    await _send(ws, {
                        "type":  "response",
                        "text":  response_text,
                        "speak": True,
                        "source": "webcam",
                    })
                except Exception as exc:
                    log.error("Webcam analysis failed: %s", exc)
                    await _send(ws, {"type": "error", "message": str(exc)[:120]})

            # ── Get current context ───────────────────────────────────────
            elif msg_type == "get_context":
                await _send(ws, {
                    "type":    "context",
                    "entries": buf.get_all(),
                    "count":   len(buf),
                })

            # ── Clear buffer ──────────────────────────────────────────────
            elif msg_type == "clear":
                remove_session(session_id)
                buf = get_or_create_session(session_id)
                await _send(ws, {"type": "ack", "action": "cleared"})

            else:
                await _send(ws, {
                    "type":    "error",
                    "message": f"Unknown message type: {msg_type!r}",
                })

    except WebSocketDisconnect:
        log.info("Meeting WS disconnected: %s", session_id)
    except Exception as exc:
        log.error("Meeting WS error [%s]: %s", session_id, exc)
    finally:
        # Keep session buffer alive for reconnect; remove after 30min via GC (future)
        pass


# ── REST helpers ──────────────────────────────────────────────────────────────

@router.get("/sessions")
async def get_sessions():
    return {"sessions": list_sessions()}


@router.delete("/sessions/{sid}")
async def delete_session(sid: str):
    remove_session(sid)
    return JSONResponse({"deleted": sid})


# ── Helper ────────────────────────────────────────────────────────────────────

async def _send(ws: WebSocket, payload: dict) -> None:
    await ws.send_text(json.dumps(payload))
