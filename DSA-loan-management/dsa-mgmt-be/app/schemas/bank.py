from pydantic import BaseModel
from typing import Optional


class BankBase(BaseModel):
    name: str
    isNationalize: bool = False
    isPrivate: bool = False
    isnbfc: bool = False
    logo: Optional[str] = None


class BankCreate(BankBase):
    pass


class BankRead(BankBase):
    id: int

    class Config:
        orm_mode = True
