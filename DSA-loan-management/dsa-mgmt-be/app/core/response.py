from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    statusCode: int = 200
    message: str = "Success"
    result: Optional[T] = None


def success_response(
    result: Any = None,
    message: str = "Success",
    status_code: int = 200,
) -> dict:
    """
    Constructs standard JSON response envelope:
    {
      "success": true,
      "statusCode": 200,
      "message": "...",
      "result": ...
    }
    """
    return {
        "success": True,
        "statusCode": status_code,
        "message": message,
        "result": jsonable_encoder(result) if result is not None else None,
    }


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    result: Any = None,
) -> JSONResponse:
    """
    Constructs standard error JSONResponse envelope:
    {
      "success": false,
      "statusCode": 400,
      "message": "...",
      "result": ...
    }
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "statusCode": status_code,
            "message": message,
            "result": jsonable_encoder(result) if result is not None else None,
        },
    )
