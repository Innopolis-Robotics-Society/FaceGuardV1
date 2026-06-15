"""convert parameters to json

Revision ID: 002
Revises: 001
Create Date: 2026-06-15 17:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Изменить parameters и result с TEXT на JSONB"""

    # Изменить parameters с TEXT на JSONB
    # Используем CASE для обработки NULL и пустых строк
    op.execute("""
        ALTER TABLE device_commands
        ALTER COLUMN parameters TYPE JSONB
        USING CASE
            WHEN parameters IS NULL THEN NULL
            WHEN parameters = '' THEN NULL
            ELSE parameters::jsonb
        END
    """)

    # Изменить result с TEXT на JSONB
    op.execute("""
        ALTER TABLE device_commands
        ALTER COLUMN result TYPE JSONB
        USING CASE
            WHEN result IS NULL THEN NULL
            WHEN result = '' THEN NULL
            ELSE result::jsonb
        END
    """)


def downgrade() -> None:
    """Откатить обратно на TEXT"""

    # Вернуть parameters на TEXT
    op.execute("""
        ALTER TABLE device_commands
        ALTER COLUMN parameters TYPE TEXT
        USING CASE
            WHEN parameters IS NULL THEN NULL
            ELSE parameters::text
        END
    """)

    # Вернуть result на TEXT
    op.execute("""
        ALTER TABLE device_commands
        ALTER COLUMN result TYPE TEXT
        USING CASE
            WHEN result IS NULL THEN NULL
            ELSE result::text
        END
    """)
