import sqlite3
from pathlib import Path

import pandas as pd
from pandas.api.types import (
    is_bool_dtype,
    is_datetime64_any_dtype,
    is_float_dtype,
    is_integer_dtype,
)


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "baseball.db"

CSV_FILES = {
    "people": BASE_DIR / "people.csv",
    "teams": BASE_DIR / "teams.csv",
    "batting": BASE_DIR / "batting.csv",
}


def quote_ident(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def sqlite_type_from_series(series: pd.Series) -> str:
    if is_integer_dtype(series):
        return "INTEGER"
    if is_float_dtype(series):
        return "REAL"
    if is_bool_dtype(series):
        return "INTEGER"
    if is_datetime64_any_dtype(series):
        return "TEXT"
    return "TEXT"


def read_csv_with_inferred_types(csv_path: Path) -> pd.DataFrame:
    # Use pandas' nullable dtypes so integer columns with missing values
    # remain integer-like instead of being forced to float.
    df = pd.read_csv(csv_path, low_memory=False).convert_dtypes()
    return df


def create_table_sql(table_name: str, df: pd.DataFrame, constraints: list[str]) -> str:
    column_defs = [
        f"{quote_ident(col)} {sqlite_type_from_series(df[col])}" for col in df.columns
    ]
    all_defs = column_defs + constraints
    return (
        f"CREATE TABLE {quote_ident(table_name)} (\n    "
        + ",\n    ".join(all_defs)
        + "\n);"
    )


def load_table(conn: sqlite3.Connection, table_name: str, df: pd.DataFrame) -> None:
    records = df.astype(object).where(pd.notna(df), None)
    placeholders = ", ".join(["?"] * len(records.columns))
    columns_sql = ", ".join(quote_ident(col) for col in records.columns)
    insert_sql = (
        f"INSERT INTO {quote_ident(table_name)} ({columns_sql}) "
        f"VALUES ({placeholders})"
    )
    conn.executemany(insert_sql, records.itertuples(index=False, name=None))


def main() -> None:
    dataframes = {
        table: read_csv_with_inferred_types(path) for table, path in CSV_FILES.items()
    }

    if DB_PATH.exists():
        DB_PATH.unlink()

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")

        people_constraints = [
            f"PRIMARY KEY ({quote_ident('playerID')})",
        ]
        teams_constraints = [
            f"PRIMARY KEY ({quote_ident('teamID')}, {quote_ident('yearID')})",
        ]
        batting_constraints = [
            (
                "PRIMARY KEY ("
                f"{quote_ident('playerID')}, {quote_ident('yearID')}, {quote_ident('stint')}"
                ")"
            ),
            (
                "FOREIGN KEY ("
                f"{quote_ident('playerID')}"
                ") REFERENCES "
                f"{quote_ident('people')}({quote_ident('playerID')})"
            ),
            (
                "FOREIGN KEY ("
                f"{quote_ident('yearID')}, {quote_ident('teamID')}"
                ") REFERENCES "
                f"{quote_ident('teams')}({quote_ident('yearID')}, {quote_ident('teamID')})"
            ),
        ]

        conn.execute(create_table_sql("people", dataframes["people"], people_constraints))
        conn.execute(create_table_sql("teams", dataframes["teams"], teams_constraints))
        conn.execute(create_table_sql("batting", dataframes["batting"], batting_constraints))

        load_table(conn, "people", dataframes["people"])
        load_table(conn, "teams", dataframes["teams"])
        load_table(conn, "batting", dataframes["batting"])

        conn.commit()

    print(f"Created database: {DB_PATH}")


if __name__ == "__main__":
    main()
