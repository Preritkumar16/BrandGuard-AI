
"""Add tenant-safe evidence links and current-version constraints."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Revision identifiers.
revision: str = "87176b7315ee"
down_revision: Union[str, Sequence[str], None] = "c726cb5fb9ba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add organisation_id as nullable initially so existing rows can
    #    be backfilled safely.
    op.add_column(
        "evidence_links",
        sa.Column("organisation_id", sa.UUID(), nullable=True),
    )

    # 2. Derive the organisation from the linked finding.
    op.execute("""
        UPDATE evidence_links AS e
        SET organisation_id = f.organisation_id
        FROM findings AS f
        WHERE e.finding_id = f.id
    """)

    # 3. Stop the migration if any existing evidence link crosses
    #    organisation boundaries or could not be backfilled.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM evidence_links AS e
                JOIN source_versions AS s
                  ON s.id = e.source_version_id
                WHERE e.organisation_id IS NULL
                   OR e.organisation_id <> s.organisation_id
            ) THEN
                RAISE EXCEPTION
                    'Evidence links contain missing or mismatched organisation IDs';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM evidence_links
                WHERE organisation_id IS NULL
            ) THEN
                RAISE EXCEPTION
                    'Evidence link organisation backfill is incomplete';
            END IF;
        END
        $$;
    """)

    # 4. Make organisation_id mandatory.
    op.alter_column(
        "evidence_links",
        "organisation_id",
        existing_type=sa.UUID(),
        nullable=False,
    )

    # 5. Remove the old single-column foreign keys.
    op.drop_constraint(
        "evidence_links_finding_id_fkey",
        "evidence_links",
        type_="foreignkey",
    )
    op.drop_constraint(
        "evidence_links_source_version_id_fkey",
        "evidence_links",
        type_="foreignkey",
    )

    # 6. Add the organisation foreign key.
    op.create_foreign_key(
        "evidence_links_organisation_id_fkey",
        "evidence_links",
        "organisations",
        ["organisation_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 7. Add tenant-aware composite foreign keys.
    op.create_foreign_key(
        "fk_evidence_link_finding_tenant",
        "evidence_links",
        "findings",
        ["finding_id", "organisation_id"],
        ["id", "organisation_id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "fk_evidence_link_source_version_tenant",
        "evidence_links",
        "source_versions",
        ["source_version_id", "organisation_id"],
        ["id", "organisation_id"],
        ondelete="CASCADE",
    )

    # 8. Add organisation index.
    op.create_index(
        "ix_evidence_links_organisation_id",
        "evidence_links",
        ["organisation_id"],
        unique=False,
    )

    # 9. Add the missing current-version tenant constraints.
    op.create_foreign_key(
        "fk_assets_current_version_parent_tenant",
        "assets",
        "asset_versions",
        ["current_version_id", "id", "organisation_id"],
        ["id", "asset_id", "organisation_id"],
        ondelete="RESTRICT",
    )

    op.create_foreign_key(
        "fk_brand_sources_current_version_parent_tenant",
        "brand_sources",
        "source_versions",
        ["current_version_id", "id", "organisation_id"],
        ["id", "source_id", "organisation_id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    # Remove current-version tenant constraints.
    op.drop_constraint(
        "fk_brand_sources_current_version_parent_tenant",
        "brand_sources",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_assets_current_version_parent_tenant",
        "assets",
        type_="foreignkey",
    )

    # Remove evidence-link index and tenant-aware constraints.
    op.drop_index(
        "ix_evidence_links_organisation_id",
        table_name="evidence_links",
    )
    op.drop_constraint(
        "fk_evidence_link_source_version_tenant",
        "evidence_links",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_evidence_link_finding_tenant",
        "evidence_links",
        type_="foreignkey",
    )
    op.drop_constraint(
        "evidence_links_organisation_id_fkey",
        "evidence_links",
        type_="foreignkey",
    )

    # Restore the original single-column foreign keys.
    op.create_foreign_key(
        "evidence_links_finding_id_fkey",
        "evidence_links",
        "findings",
        ["finding_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "evidence_links_source_version_id_fkey",
        "evidence_links",
        "source_versions",
        ["source_version_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Remove the new organisation column.
    op.drop_column("evidence_links", "organisation_id")
