"""link findings to audit runs

Revision ID: f753dc4ba24c
Revises: e3149917e8d8
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "f753dc4ba24c"
down_revision = "e3149917e8d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add nullable audit_run_id to existing findings.
    op.add_column(
        "findings",
        sa.Column("audit_run_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # 2. Create one historical audit run for each asset version
    #    that already has findings (Reconstructed Migration Record).
    op.execute(
        """
        INSERT INTO audit_runs (
            id,
            organisation_id,
            asset_version_id,
            initiated_by,
            status,
            compliance_status,
            summary,
            model_name,
            prompt_version,
            validation_result,
            error_code,
            started_at,
            completed_at
        )
        SELECT
            gen_random_uuid(),
            av.organisation_id,
            av.id,
            av.created_by,
            'COMPLETED',
            NULL,
            'Historical audit record reconstructed from findings; timestamps are approximate bounds.',
            NULL,
            NULL,
            '{"migration_reconstructed": true, "timestamp_basis": "finding_created_at_bounds", "audit_run_granularity": "one_per_asset_version"}'::jsonb,
            NULL,
            MIN(f.created_at),
            MAX(f.created_at)
        FROM findings f
        JOIN asset_versions av
          ON av.id = f.asset_version_id
         AND av.organisation_id = f.organisation_id
        GROUP BY av.id, av.organisation_id, av.created_by
        """
    )

    # 3. Associate existing findings with their historical run.
    op.execute(
        """
        UPDATE findings f
        SET audit_run_id = ar.id
        FROM audit_runs ar
        WHERE ar.asset_version_id = f.asset_version_id
          AND ar.organisation_id = f.organisation_id
          AND ar.summary =
              'Historical audit record reconstructed from findings; timestamps are approximate bounds.'
          AND f.audit_run_id IS NULL
        """
    )

    # 4. Verify every existing finding was assigned.
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM findings
                WHERE audit_run_id IS NULL
            ) THEN
                RAISE EXCEPTION
                    'Historical finding backfill incomplete';
            END IF;
        END
        $$;
        """
    )

    # 5. Make audit_run_id mandatory.
    op.alter_column(
        "findings",
        "audit_run_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )

    # 6. Add tenant-safe foreign key.
    op.create_foreign_key(
        "fk_finding_audit_run_tenant",
        "findings",
        "audit_runs",
        ["audit_run_id", "organisation_id"],
        ["id", "organisation_id"],
        ondelete="CASCADE",
    )

    # 7. Add index for audit-run finding lookups.
    op.create_index(
        "ix_findings_audit_run_id",
        "findings",
        ["audit_run_id"],
        unique=False,
    )


def downgrade() -> None:
    # Remove the index and tenant-safe foreign key.
    op.drop_index(
        "ix_findings_audit_run_id",
        table_name="findings",
    )

    op.drop_constraint(
        "fk_finding_audit_run_tenant",
        "findings",
        type_="foreignkey",
    )

    # Restore nullable audit_run_id.
    op.alter_column(
        "findings",
        "audit_run_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )

    # Remove only the finding-to-run association.
    op.drop_column("findings", "audit_run_id")