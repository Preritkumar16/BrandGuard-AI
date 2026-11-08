import sys
from sqlalchemy.orm import configure_mappers
from sqlalchemy.schema import UniqueConstraint, ForeignKeyConstraint, Index, CheckConstraint
from app.database.base import Base
import app.models  # Ensures all 12 models are registered with Base.metadata


def inspect_schema():
    print("\n========== BRANDGUARD AI DATABASE SCHEMA ==========\n")
    
    # Configure ORM mappers to catch any relationship/FK configuration errors early
    configure_mappers()

    tables = Base.metadata.sorted_tables

    for table in tables:
        print(f"\n{'=' * 60}")
        print(f"TABLE: {table.name}")
        print("=" * 60)
        
        print("\nCOLUMNS:")
        for column in table.columns:
            fk_str = ""
            if column.foreign_keys:
                fk_targets = [fk.target_fullname for fk in column.foreign_keys]
                fk_str = f" | FK: -> {', '.join(fk_targets)}"
            print(
                f"  - {column.name}"
                f" | Type: {column.type}"
                f" | Nullable: {column.nullable}"
                f" | Primary Key: {column.primary_key}"
                f" | Default: {column.default}"
                f" | Server Default: {column.server_default}"
                f"{fk_str}"
            )

        print("\nFOREIGN KEYS:")
        foreign_keys = [fk for fk in table.foreign_key_constraints]
        if foreign_keys:
            for fk in foreign_keys:
                cols = [c.name for c in fk.columns]
                refs = [element.target_fullname for element in fk.elements]
                ondelete = f" ON DELETE {fk.ondelete}" if fk.ondelete else ""
                print(f"  - FK [{', '.join(cols)}] -> REFERENCES {', '.join(refs)}{ondelete}")
        else:
            print("  - None")

        print("\nUNIQUE CONSTRAINTS:")
        unique_constraints = [c for c in table.constraints if isinstance(c, UniqueConstraint) and c.name]
        if unique_constraints:
            for uq in unique_constraints:
                cols = [c.name for c in uq.columns]
                print(f"  - {uq.name}: ({', '.join(cols)})")
        else:
            print("  - None")

        print("\nINDEXES:")
        if table.indexes:
            for idx in table.indexes:
                cols = [c.name for c in idx.columns]
                unique = " (UNIQUE)" if idx.unique else ""
                print(f"  - {idx.name}{unique}: ({', '.join(cols)})")
        else:
            print("  - None")

    print("\n" + "=" * 60)
    print(f"Total registered tables: {len(tables)}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    inspect_schema()