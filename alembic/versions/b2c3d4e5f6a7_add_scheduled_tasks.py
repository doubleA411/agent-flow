"""add scheduled_tasks table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-06 16:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'scheduled_tasks',
        sa.Column('id',            UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id',       UUID(as_uuid=True), nullable=False),
        sa.Column('agent_id',      UUID(as_uuid=True), nullable=False),
        sa.Column('prompt',        sa.Text,    nullable=False),
        sa.Column('schedule_type', sa.String,  nullable=False),
        sa.Column('run_at',        sa.DateTime, nullable=True),
        sa.Column('time_of_day',   sa.String,  nullable=True),
        sa.Column('day_of_week',   sa.String,  nullable=True),
        sa.Column('is_active',     sa.Boolean, server_default='true'),
        sa.Column('last_run_at',   sa.DateTime, nullable=True),
        sa.Column('created_at',    sa.DateTime, nullable=False),
    )
    op.create_index('ix_scheduled_tasks_user_id', 'scheduled_tasks', ['user_id'])
    op.create_index('ix_scheduled_tasks_agent_id', 'scheduled_tasks', ['agent_id'])


def downgrade() -> None:
    op.drop_index('ix_scheduled_tasks_agent_id', table_name='scheduled_tasks')
    op.drop_index('ix_scheduled_tasks_user_id',  table_name='scheduled_tasks')
    op.drop_table('scheduled_tasks')
