from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Développeur API"
    environment: str = "production"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/developpeur"
    jwt_secret: str = ""
    jwt_expire_minutes: int = 10080
    frontend_origins: str = "http://localhost:5173"
    max_snippet_code_length: int = 50000
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

settings = Settings()
