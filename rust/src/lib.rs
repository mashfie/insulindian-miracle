pub mod core;
pub mod experiments;
pub mod math_utils;
pub mod policies;
pub mod runner;
pub mod scenarios;
pub mod snapshot_physics;
pub mod terrain;
pub mod types;
pub mod whittle;

use crate::runner::{run_simulation_rust, run_sweep_from_file_rust};
use pyo3::prelude::*;

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

pub mod tests;
