import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
from pathlib import Path
from typing import Any, List, Dict
import json
import threading
from .model import SimulationResult

LOD_LOW_SCHEMA = pa.schema([
    ("run_id", pa.int64()),
    ("seed", pa.int64()),
    ("policy", pa.string()),
    ("scenario", pa.string()),
    ("cumulative_reward", pa.float64()),
    ("mean_final_extraction", pa.float64()),
    ("mean_final_openness", pa.float64()),
    ("mean_final_adaptability", pa.float64()),
    ("mean_final_resource_rent", pa.float64()),
    ("mean_productive_capital", pa.float64()),
    ("mean_reforms_triggered", pa.float64()),
    ("mean_shock_hits", pa.float64()),
    ("population_hhi", pa.float64()),
    ("population_gini", pa.float64()),
    ("zipf_slope", pa.float64()),
    ("resource_population_correlation", pa.float64()),
    ("boomtown_population_share", pa.float64()),
    ("land_share", pa.float64()),
    ("river_share", pa.float64()),
])

class DuckDBResultBuffer:
    def __init__(self, db_path: str = ":memory:", batch_size: int = 1000):
        self.con = duckdb.connect(db_path)
        self.batch_size = batch_size
        self.buffer: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        self._setup_table()

    def _setup_table(self):
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS results (
                run_id BIGINT,
                seed BIGINT,
                policy VARCHAR,
                scenario VARCHAR,
                cumulative_reward DOUBLE,
                mean_final_extraction DOUBLE,
                mean_final_openness DOUBLE,
                mean_final_adaptability DOUBLE,
                mean_final_resource_rent DOUBLE,
                mean_productive_capital DOUBLE,
                mean_reforms_triggered DOUBLE,
                mean_shock_hits DOUBLE,
                population_hhi DOUBLE,
                population_gini DOUBLE,
                zipf_slope DOUBLE,
                resource_population_correlation DOUBLE,
                boomtown_population_share DOUBLE,
                land_share DOUBLE,
                river_share DOUBLE
            )
        """)

    def add_result(self, result: SimulationResult, run_id: int, scenario: str = "unknown"):
        row = {
            "run_id": run_id,
            "seed": result.seed,
            "policy": result.policy,
            "scenario": scenario,
            "cumulative_reward": result.cumulative_reward,
            "mean_final_extraction": result.metrics.get("mean_final_extraction", 0.0),
            "mean_final_openness": result.metrics.get("mean_final_openness", 0.0),
            "mean_final_adaptability": result.metrics.get("mean_final_adaptability", 0.0),
            "mean_final_resource_rent": result.metrics.get("mean_final_resource_rent", 0.0),
            "mean_productive_capital": result.metrics.get("mean_productive_capital", 0.0),
            "mean_reforms_triggered": result.metrics.get("mean_reforms_triggered", 0.0),
            "mean_shock_hits": result.metrics.get("mean_shock_hits", 0.0),
            "population_hhi": result.metrics.get("population_hhi", 0.0),
            "population_gini": result.metrics.get("population_gini", 0.0),
            "zipf_slope": result.metrics.get("zipf_slope", 0.0),
            "resource_population_correlation": result.metrics.get("resource_population_correlation", 0.0),
            "boomtown_population_share": result.metrics.get("boomtown_population_share", 0.0),
            "land_share": result.terrain_summary.get("land_share", 0.0),
            "river_share": result.terrain_summary.get("river_share", 0.0),
        }
        with self._lock:
            self.buffer.append(row)
            if len(self.buffer) >= self.batch_size:
                self._flush_locked()

    def flush(self):
        with self._lock:
            self._flush_locked()

    def _flush_locked(self):
        if not self.buffer:
            return
        
        table = pa.Table.from_pylist(self.buffer, schema=LOD_LOW_SCHEMA)
        self.con.register("temp_table", table)
        self.con.execute("INSERT INTO results SELECT * FROM temp_table")
        self.con.unregister("temp_table")
        self.buffer = []

    def export_to_parquet(self, output_path: str):
        self.flush()
        # Ensure no other thread is writing while exporting
        with self._lock:
            self.con.execute(f"COPY results TO '{output_path}' (FORMAT PARQUET)")

    def close(self):
        self.con.close()
