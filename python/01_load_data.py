import json
import pandas as pd
import pyarrow.parquet as pq
from pathlib import Path
from typing import List, Optional

def load_parquet_results(dir_path: str) -> pd.DataFrame:
    """Load all Parquet files from a directory into a single DataFrame."""
    path = Path(dir_path)
    if not path.exists() or not path.is_dir():
        print(f"Warning: Directory {dir_path} not found.")
        return pd.DataFrame()
    
    files = list(path.glob('*.parquet'))
    if not files:
        print(f"Warning: No parquet files found in {dir_path}")
        return pd.DataFrame()
        
    df = pq.read_table(dir_path).to_pandas()
    return df

def load_compare_json(file_path: str) -> pd.DataFrame:
    """Load JSON output from the Compare command."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
        
    with open(path, 'r') as f:
        data = json.load(f)
        
    return pd.json_normalize(data)

def preprocess_results(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure categorical columns are properly typed."""
    if 'policy' in df.columns:
        df['policy'] = df['policy'].astype('category')
    if 'scenario' in df.columns:
        df['scenario'] = df['scenario'].astype('category')
    return df

# Example usage:
# df = load_parquet_results('../results/low')
# df = preprocess_results(df)
