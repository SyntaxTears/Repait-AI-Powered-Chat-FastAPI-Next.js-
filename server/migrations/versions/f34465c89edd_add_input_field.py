"""add input field

Revision ID: f34465c89edd
Revises: initial_migration
Create Date: 2025-05-04 14:17:58.416301

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f34465c89edd'
down_revision = 'initial_migration'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('diagnostic_results', sa.Column('input_message', sa.Text(), nullable=True))
    op.create_index(op.f('ix_diagnostic_results_id'), 'diagnostic_results', ['id'], unique=False)
    op.create_index(op.f('ix_part_predictions_id'), 'part_predictions', ['id'], unique=False)
    op.create_index(op.f('ix_repair_notes_id'), 'repair_notes', ['id'], unique=False)
    op.create_index(op.f('ix_repair_summaries_id'), 'repair_summaries', ['id'], unique=False)
    op.create_index(op.f('ix_sessions_id'), 'sessions', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_sessions_id'), table_name='sessions')
    op.drop_index(op.f('ix_repair_summaries_id'), table_name='repair_summaries')
    op.drop_index(op.f('ix_repair_notes_id'), table_name='repair_notes')
    op.drop_index(op.f('ix_part_predictions_id'), table_name='part_predictions')
    op.drop_index(op.f('ix_diagnostic_results_id'), table_name='diagnostic_results')
    op.drop_column('diagnostic_results', 'input_message')
    # ### end Alembic commands ###
