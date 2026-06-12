import os


class Settings:
    app_name: str = os.getenv("APP_NAME", "FaceGuard API")
    app_version: str = os.getenv("APP_VERSION", "0.1.0")
    environment: str = os.getenv("APP_ENV", "development")

    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://faceguard:faceguard@db:5432/faceguard",
    )

    data_dir: str = os.getenv("DATA_DIR", "/data")


settings = Settings()