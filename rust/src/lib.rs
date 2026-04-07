pub mod types;
pub mod core;
pub mod math_utils;
pub mod snapshot_physics;
pub mod policies;
pub mod whittle;
pub mod terrain;
pub mod scenarios;
pub mod runner;

use pyo3::prelude::*;
use crate::runner::{run_sweep_from_file_rust, run_simulation_rust};

#[pyfunction]
fn hello_miracle() -> PyResult<String> {
    Ok("Miracle Engine loaded successfully!".into())
}

#[pymodule]
fn engine(_py: Python, m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(hello_miracle, m)?)?;
    m.add_function(wrap_pyfunction!(run_sweep_from_file_rust, m)?)?;
    m.add_function(wrap_pyfunction!(run_simulation_rust, m)?)?;
    Ok(())
}
