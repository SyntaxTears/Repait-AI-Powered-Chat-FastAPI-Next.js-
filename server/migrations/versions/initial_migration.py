"""Initial migration

Revision ID: initial_migration
Revises: 
Create Date: 2023-05-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'initial_migration'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    
    # Create sessions table
    op.create_table('sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('input_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create diagnostic_results table
    op.create_table('diagnostic_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('output_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create part_predictions table
    op.create_table('part_predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('part_name', sa.String(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('selected', sa.Boolean(), default=True, nullable=True),
        sa.Column('price_estimate', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create repair_notes table
    op.create_table('repair_notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('note_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create repair_summaries table
    op.create_table('repair_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('summary_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('repair_summaries')
    op.drop_table('repair_notes')
    op.drop_table('part_predictions')
    op.drop_table('diagnostic_results')
    op.drop_table('sessions')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
