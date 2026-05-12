"""add user_settings table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-12 17:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_settings',
        sa.Column('id',                UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id',           UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('anthropic_api_key', sa.String, nullable=True),
        sa.Column('openai_api_key',    sa.String, nullable=True),
        sa.Column('groq_api_key',      sa.String, nullable=True),
        sa.Column('ollama_url',        sa.String, nullable=True),
        sa.Column('updated_at',        sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table('user_settings')
