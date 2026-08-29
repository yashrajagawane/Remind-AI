import os
import uuid
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException

# Initialize cloudinary if URL is present
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
if CLOUDINARY_URL:
    cloudinary.config(url=CLOUDINARY_URL)

ALLOWED_EXTENSIONS = {"jpeg", "jpg", "png", "webp"}
MAX_FILE_SIZE_MB = 10

def is_valid_image(filename: str) -> bool:
    ext = filename.split(".")[-1].lower()
    return ext in ALLOWED_EXTENSIONS

def upload_image(file: UploadFile) -> str:
    """
    Uploads an image to Cloudinary and returns the secure URL.
    Falls back to a local placeholder if Cloudinary isn't configured.
    """
    if not is_valid_image(file.filename):
        raise HTTPException(status_code=400, detail="Invalid image format. Only JPEG, PNG, and WEBP are allowed.")

    # In a real app we'd also check the file size by reading chunks, 
    # but FastAPI allows configuring max upload size at the server level.

    if not CLOUDINARY_URL:
        # Fallback for local development if Cloudinary is not set
        return f"https://api.dicebear.com/7.x/initials/svg?seed={uuid.uuid4().hex[:6]}"

    try:
        # We can read the file directly since UploadFile acts as a file-like object
        result = cloudinary.uploader.upload(
            file.file,
            folder="remind_ai/faces",
            resource_type="image"
        )
        return result.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
