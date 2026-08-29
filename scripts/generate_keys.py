import os
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

def generate_keys():
    certs_dir = Path(__file__).resolve().parent.parent / "certs"
    certs_dir.mkdir(exist_ok=True)

    private_key_path = certs_dir / "private_key.pem"
    public_key_path = certs_dir / "public_key.pem"

    if private_key_path.exists() and public_key_path.exists():
        print(f"✅ Keys already exist in {certs_dir}")
        return

    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    # Write private key
    with open(private_key_path, "wb") as f:
        f.write(
            private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
        )
    print(f"[+] Wrote private key to {private_key_path}")

    # Generate public key
    public_key = private_key.public_key()
    with open(public_key_path, "wb") as f:
        f.write(
            public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
        )
    print(f"[+] Wrote public key to {public_key_path}")
    print("[OK] Key generation complete.")

if __name__ == "__main__":
    generate_keys()
