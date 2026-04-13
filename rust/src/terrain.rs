#![allow(clippy::needless_range_loop)]

use crate::types::{Site, TerrainConfig};
use rand::prelude::*;
use rand_pcg::Pcg64;
use std::f64::consts::PI;

pub struct TerrainField {
    pub elevation: Vec<Vec<f64>>,
    pub land_mask: Vec<Vec<bool>>,
    pub coast_mask: Vec<Vec<bool>>,
    pub river_mask: Vec<Vec<bool>>,
    pub river_distance: Vec<Vec<f64>>,
    pub coastal_distance: Vec<Vec<f64>>,
    pub accessibility: Vec<Vec<f64>>,
    pub arability: Vec<Vec<f64>>,
    pub resource_rent: Vec<Vec<f64>>,
    pub defensibility: Vec<Vec<f64>>,
    pub port_quality: Vec<Vec<f64>>,
    pub suitability: Vec<Vec<f64>>,
}

fn fade(t: f64) -> f64 {
    t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
}

fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + t * (b - a)
}

fn dot(g: [f64; 2], x: f64, y: f64) -> f64 {
    g[0] * x + g[1] * y
}

fn perlin_noise(width: usize, height: usize, resolution: usize, rng: &mut Pcg64) -> Vec<Vec<f64>> {
    let mut gradients = vec![vec![[0.0, 0.0]; resolution + 1]; resolution + 1];
    for gy in 0..=resolution {
        for gx in 0..=resolution {
            let angle = rng.gen_range(0.0..2.0 * PI);
            gradients[gy][gx] = [angle.cos(), angle.sin()];
        }
    }

    let mut noise = vec![vec![0.0; width]; height];
    for iy in 0..height {
        let py = (iy as f64 / (height - 1).max(1) as f64) * resolution as f64;
        let y0 = py.floor() as usize;
        let y1 = (y0 + 1).min(resolution);
        let ty = py - y0 as f64;
        let sy = fade(ty);

        for ix in 0..width {
            let px = (ix as f64 / (width - 1).max(1) as f64) * resolution as f64;
            let x0 = px.floor() as usize;
            let x1 = (x0 + 1).min(resolution);
            let tx = px - x0 as f64;
            let sx = fade(tx);

            let d00 = dot(gradients[y0][x0], tx, ty);
            let d10 = dot(gradients[y0][x1], tx - 1.0, ty);
            let d01 = dot(gradients[y1][x0], tx, ty - 1.0);
            let d11 = dot(gradients[y1][x1], tx - 1.0, ty - 1.0);

            let nx0 = lerp(d00, d10, sx);
            let nx1 = lerp(d01, d11, sx);
            noise[iy][ix] = lerp(nx0, nx1, sy);
        }
    }
    noise
}

fn fractal_noise(config: &TerrainConfig, rng: &mut Pcg64) -> Vec<Vec<f64>> {
    let mut total = vec![vec![0.0; config.width as usize]; config.height as usize];
    let mut amplitude = 1.0;
    let mut frequency = 2;
    let mut amplitude_sum = 0.0;

    for _ in 0..config.octaves {
        let noise = perlin_noise(
            config.width as usize,
            config.height as usize,
            frequency as usize,
            rng,
        );
        for y in 0..config.height as usize {
            for x in 0..config.width as usize {
                total[y][x] += amplitude * noise[y][x];
            }
        }
        amplitude_sum += amplitude;
        amplitude *= config.persistence;
        frequency = (frequency as f64 * config.lacunarity).round() as i32;
    }

    for y in 0..config.height as usize {
        for x in 0..config.width as usize {
            total[y][x] /= amplitude_sum.max(1e-9);
        }
    }
    total
}

fn normalize(field: &mut [Vec<f64>], mask: Option<&[Vec<bool>]>) {
    let mut min = f64::MAX;
    let mut max = f64::MIN;
    let mut found = false;

    for y in 0..field.len() {
        for x in 0..field[0].len() {
            if let Some(m) = mask {
                if !m[y][x] {
                    continue;
                }
            }
            min = min.min(field[y][x]);
            max = max.max(field[y][x]);
            found = true;
        }
    }

    if !found || (max - min).abs() < 1e-9 {
        for y in 0..field.len() {
            for x in 0..field[0].len() {
                field[y][x] = 0.0;
            }
        }
        return;
    }

    for y in 0..field.len() {
        for x in 0..field[0].len() {
            if let Some(m) = mask {
                if !m[y][x] {
                    field[y][x] = 0.0;
                    continue;
                }
            }
            field[y][x] = (field[y][x] - min) / (max - min);
        }
    }
}

fn compute_downstream(
    elevation: &[Vec<f64>],
    land_mask: &[Vec<bool>],
) -> (Vec<Vec<i32>>, Vec<Vec<i32>>) {
    let height = elevation.len();
    let width = elevation[0].len();
    let mut dy = vec![vec![-1i32; width]; height];
    let mut dx = vec![vec![-1i32; width]; height];
    for y in 0..height {
        for x in 0..width {
            if !land_mask[y][x] {
                continue;
            }
            let mut best_y = y as i32;
            let mut best_x = x as i32;
            let mut best_elev = elevation[y][x];
            for dy_n in -1i32..=1 {
                for dx_n in -1i32..=1 {
                    if dx_n == 0 && dy_n == 0 {
                        continue;
                    }
                    let ny = y as i32 + dy_n;
                    let nx = x as i32 + dx_n;
                    if ny < 0 || ny >= height as i32 || nx < 0 || nx >= width as i32 {
                        continue;
                    }
                    let (ny, nx) = (ny as usize, nx as usize);
                    if land_mask[ny][nx] && elevation[ny][nx] < best_elev {
                        best_elev = elevation[ny][nx];
                        best_y = ny as i32;
                        best_x = nx as i32;
                    }
                }
            }
            dy[y][x] = best_y;
            dx[y][x] = best_x;
        }
    }
    (dy, dx)
}

fn quantile_linear(values: &mut [f64], q: f64) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let q = q.clamp(0.0, 1.0);
    let pos = (values.len() - 1) as f64 * q;
    let lo = pos.floor() as usize;
    let hi = (pos.ceil() as usize).min(values.len() - 1);
    let t = pos - lo as f64;
    values[lo] * (1.0 - t) + values[hi] * t
}

fn derive_river(
    elevation: &[Vec<f64>],
    land_mask: &[Vec<bool>],
    coast_mask: &[Vec<bool>],
    coastal_dist: &[Vec<f64>],
    config: &TerrainConfig,
) -> Vec<Vec<bool>> {
    let height = elevation.len();
    let width = elevation[0].len();
    let (down_y, down_x) = compute_downstream(elevation, land_mask);
    let mut flux = vec![vec![0.0; width]; height];
    for y in 0..height {
        for x in 0..width {
            if land_mask[y][x] {
                flux[y][x] = 1.0;
            }
        }
    }
    let mut order: Vec<(usize, usize)> = Vec::new();
    for y in 0..height {
        for x in 0..width {
            if land_mask[y][x] {
                order.push((y, x));
            }
        }
    }
    order.sort_by(|(y1, x1), (y2, x2)| {
        elevation[*y2][*x2]
            .partial_cmp(&elevation[*y1][*x1])
            .unwrap()
    });
    for (y, x) in order {
        let ny = down_y[y][x] as usize;
        let nx = down_x[y][x] as usize;
        if ny == y && nx == x {
            continue;
        }
        flux[ny][nx] += flux[y][x];
    }

    let mut candidates_elev: Vec<f64> = Vec::new();
    for y in 0..height {
        for x in 0..width {
            if land_mask[y][x] && coastal_dist[y][x] > 4.0 {
                candidates_elev.push(elevation[y][x]);
            }
        }
    }
    let mut source_score: Vec<Vec<f64>> = vec![vec![-1.0; width]; height];
    if !candidates_elev.is_empty() {
        let q = quantile_linear(&mut candidates_elev, config.river_source_quantile);
        for y in 0..height {
            for x in 0..width {
                if land_mask[y][x] && coastal_dist[y][x] > 4.0 && elevation[y][x] >= q {
                    source_score[y][x] = flux[y][x] * elevation[y][x];
                }
            }
        }
    } else {
        for y in 0..height {
            for x in 0..width {
                if land_mask[y][x] {
                    source_score[y][x] = flux[y][x] * elevation[y][x];
                }
            }
        }
    }

    let mut best_y = 0usize;
    let mut best_x = 0usize;
    let mut best_s = f64::NEG_INFINITY;
    for y in 0..height {
        for x in 0..width {
            if source_score[y][x] > best_s {
                best_s = source_score[y][x];
                best_y = y;
                best_x = x;
            }
        }
    }

    let mut river = vec![vec![false; width]; height];
    let mut y = best_y;
    let mut x = best_x;
    for _ in 0..(height * width) {
        if !land_mask[y][x] {
            break;
        }
        river[y][x] = true;
        if coast_mask[y][x] {
            break;
        }
        let ny = down_y[y][x] as usize;
        let nx = down_x[y][x] as usize;
        if ny == y && nx == x {
            break;
        }
        y = ny;
        x = nx;
    }
    river
}

/// Fraction of grid that is land, and fraction of land cells on the main river path.
pub fn terrain_shares(terrain: &TerrainField) -> (f64, f64) {
    let h = terrain.land_mask.len();
    if h == 0 {
        return (0.0, 0.0);
    }
    let w = terrain.land_mask[0].len();
    let total = (h * w) as f64;
    let mut land_n = 0usize;
    let mut river_on_land = 0usize;
    for y in 0..h {
        for x in 0..w {
            if terrain.land_mask[y][x] {
                land_n += 1;
                if terrain.river_mask[y][x] {
                    river_on_land += 1;
                }
            }
        }
    }
    let land_share = land_n as f64 / total;
    let river_share = if land_n > 0 {
        river_on_land as f64 / land_n as f64
    } else {
        0.0
    };
    (land_share, river_share)
}

fn distance_transform(mask: &[Vec<bool>]) -> Vec<Vec<f64>> {
    let height = mask.len();
    let width = mask[0].len();
    let mut dist = vec![vec![f64::MAX; width]; height];

    // Simple 2-pass distance transform (Manhattan/Euclidean approximation)
    for y in 0..height {
        for x in 0..width {
            if mask[y][x] {
                dist[y][x] = 0.0;
            } else {
                if y > 0 {
                    dist[y][x] = dist[y][x].min(dist[y - 1][x] + 1.0);
                }
                if x > 0 {
                    dist[y][x] = dist[y][x].min(dist[y][x - 1] + 1.0);
                }
            }
        }
    }

    for y in (0..height).rev() {
        for x in (0..width).rev() {
            if y < height - 1 {
                dist[y][x] = dist[y][x].min(dist[y + 1][x] + 1.0);
            }
            if x < width - 1 {
                dist[y][x] = dist[y][x].min(dist[y][x + 1] + 1.0);
            }
        }
    }
    dist
}

pub fn generate_terrain_rust(config: &crate::types::SimulationConfig) -> TerrainField {
    let mut rng = Pcg64::seed_from_u64(config.terrain.seed as u64);
    let base_noise = fractal_noise(&config.terrain, &mut rng);

    let res_seed = rng.gen::<u64>();
    let mut res_rng = Pcg64::seed_from_u64(res_seed);
    let resource_noise = fractal_noise(&config.terrain, &mut res_rng);

    let height = config.terrain.height as usize;
    let width = config.terrain.width as usize;
    let mut elevation = vec![vec![0.0; width]; height];

    for y in 0..height {
        let fy = (y as f64 / (height - 1).max(1) as f64) * 2.0 - 1.0;
        for x in 0..width {
            let fx = (x as f64 / (width - 1).max(1) as f64) * 2.0 - 1.0;

            let spine = config.spine_height - config.spine_curvature * fy * fy;
            let taper = config.taper_offset
                - config.taper_curvature_x * (fx + config.taper_bias_x).powi(2)
                - config.taper_linear_x * fx;
            let headland = config.headland_height
                * (-((fx - config.headland_x).powi(2) / 0.09 + fy.powi(2) / 0.26)).exp();
            let mainland_bridge = config.mainland_bridge_height
                * (-((fx + 1.0).powi(2) / 0.02 + fy.powi(2) / 0.5)).exp();

            elevation[y][x] = 0.85 * base_noise[y][x] + spine + taper + headland + mainland_bridge;
        }
    }

    normalize(&mut elevation, None);

    let mut land_mask = vec![vec![false; width]; height];
    let mut coast_mask = vec![vec![false; width]; height];
    for y in 0..height {
        for x in 0..width {
            if elevation[y][x] > config.terrain.sea_level {
                land_mask[y][x] = true;
            }
        }
        land_mask[y][0] = true;
    }

    for y in 0..height {
        for x in 0..width {
            if !land_mask[y][x] {
                continue;
            }
            let mut is_coast = false;
            for dy in -1..=1 {
                for dx in -1..=1 {
                    let ny = y as i32 + dy;
                    let nx = x as i32 + dx;
                    if ny >= 0
                        && ny < height as i32
                        && nx >= 0
                        && nx < width as i32
                        && !land_mask[ny as usize][nx as usize]
                    {
                        is_coast = true;
                        break;
                    }
                }
                if is_coast {
                    break;
                }
            }
            coast_mask[y][x] = is_coast;
        }
    }

    let coastal_distance = distance_transform(&coast_mask);
    let river_mask = derive_river(
        &elevation,
        &land_mask,
        &coast_mask,
        &coastal_distance,
        &config.terrain,
    );
    let river_distance = distance_transform(&river_mask);

    let mut accessibility = vec![vec![0.0; width]; height];
    let mut arability = vec![vec![0.0; width]; height];
    let mut defensibility = vec![vec![0.0; width]; height];
    let mut port_quality = vec![vec![0.0; width]; height];
    let mut resource_rent = vec![vec![0.0; width]; height];
    let mut suitability = vec![vec![0.0; width]; height];

    for y in 0..height {
        let fy = (y as f64 / (height - 1).max(1) as f64) * 2.0 - 1.0;
        for x in 0..width {
            let fx = (x as f64 / (width - 1).max(1) as f64) * 2.0 - 1.0;

            accessibility[y][x] = (-(((fx + 1.0).powi(2) + fy.powi(2)).sqrt() * 1.2)).exp();
            arability[y][x] = (-(0.18 * river_distance[y][x])).exp()
                * (1.0 - (elevation[y][x] - config.terrain.sea_level).clamp(0.0, 1.0));
            defensibility[y][x] = coastal_distance[y][x];
            port_quality[y][x] = (-1.1 * coastal_distance[y][x]).exp();

            let geology = 0.55 * resource_noise[y][x]
                + 0.45 * (-((fx - 0.1).powi(2) / 0.55 + (fy + 0.15).powi(2) / 0.3)).exp();
            resource_rent[y][x] = geology;
        }
    }

    normalize(&mut accessibility, Some(&land_mask));
    normalize(&mut arability, Some(&land_mask));
    normalize(&mut defensibility, Some(&land_mask));
    normalize(&mut port_quality, Some(&land_mask));
    normalize(&mut resource_rent, Some(&land_mask));

    for y in 0..height {
        for x in 0..width {
            suitability[y][x] = 0.28 * port_quality[y][x]
                + 0.2 * (-0.2 * river_distance[y][x]).exp()
                + 0.18 * accessibility[y][x]
                + 0.18 * arability[y][x]
                + 0.1 * defensibility[y][x]
                + 0.06 * resource_rent[y][x];
        }
    }
    normalize(&mut suitability, Some(&land_mask));

    TerrainField {
        elevation,
        land_mask,
        coast_mask,
        river_mask,
        river_distance,
        coastal_distance,
        accessibility,
        arability,
        resource_rent,
        defensibility,
        port_quality,
        suitability,
    }
}

pub fn select_candidate_sites_rust(
    terrain: &TerrainField,
    count: usize,
    min_spacing: f64,
) -> Vec<Site> {
    let height = terrain.elevation.len();
    let width = terrain.elevation[0].len();
    let max_border_distance = 1.0_f64.max((width.min(height) as f64) / 2.0 - 1.0);

    let mut cells = Vec::new();
    let mut interior_cells = Vec::new();

    for y in 0..height {
        for x in 0..width {
            if terrain.land_mask[y][x] {
                let border_distance = x.min(width - 1 - x).min(y).min(height - 1 - y) as f64;
                let border_bonus = (border_distance / max_border_distance).clamp(0.0, 1.0);
                let inland_bonus = (terrain.coastal_distance[y][x] / 8.0).clamp(0.0, 1.0);
                let priority =
                    0.8 * terrain.suitability[y][x] + 0.12 * border_bonus + 0.08 * inland_bonus;

                let candidate = (priority, y, x, border_distance == 0.0);
                cells.push(candidate);
                if border_distance > 0.0 {
                    interior_cells.push(candidate);
                }
            }
        }
    }

    let mut ranked = if interior_cells.len() >= count {
        interior_cells
    } else {
        cells
    };
    ranked.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());

    let mut sites: Vec<Site> = Vec::new();
    let mut selected_indices = std::collections::HashSet::new();

    while sites.len() < count && selected_indices.len() < ranked.len() {
        let mut best_index: i32 = -1;
        let mut best_score = -1.0;

        for (index, &(priority, y, x, _is_border)) in ranked.iter().enumerate() {
            if selected_indices.contains(&index) {
                continue;
            }
            let norm_x = x as f64 / (width - 1).max(1) as f64;
            let norm_y = y as f64 / (height - 1).max(1) as f64;

            let nearest = if sites.is_empty() {
                1.0
            } else {
                sites
                    .iter()
                    .map(|site| ((norm_x - site.x).powi(2) + (norm_y - site.y).powi(2)).sqrt())
                    .fold(f64::INFINITY, f64::min)
            };

            if !sites.is_empty() && nearest < min_spacing {
                continue;
            }

            let spread = (nearest / min_spacing.max(1e-9)).min(1.0);
            let score = 0.72 * priority + 0.28 * spread;

            if score > best_score {
                best_score = score;
                best_index = index as i32;
            }
        }

        if best_index < 0 {
            break;
        }

        let best_idx = best_index as usize;
        selected_indices.insert(best_idx);
        let (_priority, y, x, _is_border) = ranked[best_idx];
        let norm_x = x as f64 / (width - 1).max(1) as f64;
        let norm_y = y as f64 / (height - 1).max(1) as f64;
        let river_access = (-0.22 * terrain.river_distance[y][x]).exp();

        sites.push(Site {
            id: sites.len() as i32,
            x: norm_x,
            y: norm_y,
            port_access: terrain.port_quality[y][x],
            river_access,
            arability: terrain.arability[y][x],
            defensibility: terrain.defensibility[y][x],
            accessibility: terrain.accessibility[y][x],
            resource_rent: terrain.resource_rent[y][x],
            suitability: terrain.suitability[y][x],
            ..Default::default()
        });
    }

    sites
}
