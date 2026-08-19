from database import Base, engine
import models


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    main()