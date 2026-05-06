"""add org_context and memories tables

Revision ID: a1b2c3d4e5f6
Revises: 5b1d9152fbcc
Create Date: 2026-05-06 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '5b1d9152fbcc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'org_context',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('company_name', sa.String, nullable=True),
        sa.Column('mission', sa.Text, nullable=True),
        sa.Column('industry', sa.String, nullable=True),
        sa.Column('team_size', sa.String, nullable=True),
        sa.Column('product_description', sa.Text, nullable=True),
        sa.Column('goals', sa.Text, nullable=True),
        sa.Column('extra', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
    )

    op.create_table(
        'memories',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String, nullable=False),
        sa.Column('value', sa.Text, nullable=False),
        sa.Column('source', sa.String, nullable=False, server_default='manual'),
        sa.Column('session_id', UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
    )
    op.create_index('ix_memories_user_id', 'memories', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_memories_user_id', table_name='memories')
    op.drop_table('memories')
    op.drop_table('org_context')
