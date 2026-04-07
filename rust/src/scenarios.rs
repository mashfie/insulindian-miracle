use crate::types::SimulationConfig;
use serde_json::Value;

pub fn apply_scenario_rust(config: SimulationConfig, scenario_json: &str) -> SimulationConfig {
    let mut config_val = serde_json::to_value(&config).unwrap();
    let scenario: Value = serde_json::from_str(scenario_json).unwrap();
    
    if let Some(overrides) = scenario.get("overrides") {
        if let Some(obj) = overrides.as_object() {
            for (key, val) in obj {
                if key == "terrain" {
                    if let Some(terrain_overrides) = val.as_object() {
                        let config_obj = config_val.as_object_mut().unwrap();
                        let terrain_obj = config_obj.get_mut("terrain").unwrap().as_object_mut().unwrap();
                        for (tk, tv) in terrain_overrides {
                            terrain_obj.insert(tk.clone(), tv.clone());
                        }
                    }
                } else {
                    config_val.as_object_mut().unwrap().insert(key.clone(), val.clone());
                }
            }
        }
    }
    
    serde_json::from_value(config_val).unwrap()
}
