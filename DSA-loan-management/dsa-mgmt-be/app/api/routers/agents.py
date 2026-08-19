from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from pathlib import Path
from io import BytesIO
from PIL import Image
import os
from uuid import uuid4

from app.db.session import SessionLocal
from app.models.agent import Agent

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_photo_storage() -> Path:
    project_root = Path(__file__).resolve().parents[3]
    storage = project_root / 'dsa-file-storage' / 'agent-photos'
    storage.mkdir(parents=True, exist_ok=True)
    return storage


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("")
def list_agents(include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(Agent)
    if not include_inactive:
        query = query.filter(Agent.isActive == True)
    agents = query.all()
    return [_serialize(a) for a in agents]


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("")
def create_agent(
    name: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    password: str = Form(...),
    isAdmin: bool = Form(False),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    existing = db.query(Agent).filter(Agent.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="email already in use")

    photo_fname: Optional[str] = None
    if file is not None:
        photo_fname = _save_photo(file)

    agent = Agent(
        name=name,
        email=email,
        mobile=mobile,
        password=password,
        tempPassword=password,
        tempPasswordReset=False,
        isAdmin=isAdmin,
        photo=photo_fname,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return _serialize(agent)


# ── Update ────────────────────────────────────────────────────────────────────

@router.put("/{agent_id}")
def update_agent(
    agent_id: int,
    name: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    isAdmin: bool = Form(False),
    file: UploadFile | None = File(None),
    remove_photo: bool = Form(False),
    db: Session = Depends(get_db),
):
    a = db.query(Agent).filter(Agent.id == agent_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="agent not found")

    conflict = db.query(Agent).filter(Agent.email == email, Agent.id != agent_id).first()
    if conflict:
        raise HTTPException(status_code=400, detail="email already in use")

    storage = get_photo_storage()

    if file is not None:
        new_fname = _save_photo(file)
        if a.photo:
            _delete_file(storage / a.photo)
        a.photo = new_fname
    elif remove_photo and a.photo:
        _delete_file(storage / a.photo)
        a.photo = None

    a.name = name
    a.email = email
    a.mobile = mobile
    a.isAdmin = isAdmin
    db.add(a)
    db.commit()
    db.refresh(a)
    return _serialize(a)


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    a = db.query(Agent).filter(Agent.id == agent_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="agent not found")
    a.isActive = False
    db.add(a)
    db.commit()
    return {"status": "ok"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _save_photo(file: UploadFile) -> str:
    contents = file.file.read()
    size_limit = 3 * 1024 * 1024
    if len(contents) > size_limit:
        raise HTTPException(status_code=400, detail="file too large; max 3MB")
    try:
        Image.open(BytesIO(contents)).verify()
    except Exception:
        raise HTTPException(status_code=400, detail="invalid image file")
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    fname = f"{uuid4().hex}{ext}"
    storage = get_photo_storage()
    with open(storage / fname, "wb") as f:
        f.write(contents)
    return fname


def _delete_file(path: Path):
    try:
        if path.exists():
            path.unlink()
    except Exception:
        pass


def _serialize(a: Agent) -> dict:
    return {
        "id": a.id,
        "name": a.name,
        "email": a.email,
        "mobile": a.mobile,
        "tempPassword": a.tempPassword,
        "tempPasswordReset": a.tempPasswordReset,
        "isAdmin": a.isAdmin,
        "photo": a.photo,
        "isActive": a.isActive,
    }
