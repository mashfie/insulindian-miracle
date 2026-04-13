use ndarray::Array2;

pub fn invert_matrix(matrix: &Array2<f64>) -> Option<Array2<f64>> {
    let n = matrix.nrows();
    if n != matrix.ncols() {
        return None;
    }
    let mut a = matrix.clone();
    let mut inv = Array2::<f64>::eye(n);

    for i in 0..n {
        let mut pivot = i;
        for j in (i + 1)..n {
            if a[[j, i]].abs() > a[[pivot, i]].abs() {
                pivot = j;
            }
        }
        if a[[pivot, i]].abs() < 1e-12 {
            return None; // Singular
        }
        if pivot != i {
            for k in 0..n {
                let temp = a[[i, k]];
                a[[i, k]] = a[[pivot, k]];
                a[[pivot, k]] = temp;
                let temp = inv[[i, k]];
                inv[[i, k]] = inv[[pivot, k]];
                inv[[pivot, k]] = temp;
            }
        }
        let pivot_val = a[[i, i]];
        for k in 0..n {
            a[[i, k]] /= pivot_val;
            inv[[i, k]] /= pivot_val;
        }
        for j in 0..n {
            if i != j {
                let factor = a[[j, i]];
                for k in 0..n {
                    a[[j, k]] -= factor * a[[i, k]];
                    inv[[j, k]] -= factor * inv[[i, k]];
                }
            }
        }
    }
    Some(inv)
}

pub fn cholesky_decomposition(matrix: &Array2<f64>) -> Option<Array2<f64>> {
    let n = matrix.nrows();
    if n != matrix.ncols() {
        return None;
    }
    let mut l = Array2::<f64>::zeros((n, n));

    for i in 0..n {
        for j in 0..=i {
            let mut sum = 0.0;
            for k in 0..j {
                sum += l[[i, k]] * l[[j, k]];
            }
            if i == j {
                let val = matrix[[i, i]] - sum;
                if val <= 0.0 {
                    return None; // Not positive definite
                }
                l[[i, j]] = val.sqrt();
            } else {
                l[[i, j]] = (matrix[[i, j]] - sum) / l[[j, j]];
            }
        }
    }
    Some(l)
}

pub fn calculate_gini(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    let mut sorted_values = values.to_vec();
    sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let n = sorted_values.len() as f64;
    let sum: f64 = sorted_values.iter().sum();
    if sum.abs() < 1e-9 {
        return 0.0;
    }

    let mut weighted_sum = 0.0;
    for (i, &val) in sorted_values.iter().enumerate() {
        weighted_sum += (i as f64 + 1.0) * val;
    }

    (2.0 * weighted_sum) / (n * sum) - (n + 1.0) / n
}

pub fn calculate_hhi(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    let sum: f64 = values.iter().sum();
    if sum.abs() < 1e-9 {
        return 0.0;
    }

    let mut hhi = 0.0;
    for &val in values {
        let weight = val / sum;
        hhi += weight * weight;
    }
    hhi
}

pub fn calculate_zipf_slope(populations: &[f64]) -> f64 {
    let mut positive: Vec<f64> = populations.iter().cloned().filter(|&p| p > 0.0).collect();
    if positive.len() < 2 {
        return 0.0;
    }
    positive.sort_by(|a, b| b.partial_cmp(a).unwrap());

    let n = positive.len();
    let raw_tail = 3.max(n.min(3.max(n / 3)));
    let tail_count = raw_tail.min(n);
    let tail = &positive[0..tail_count];

    let mut sum_x = 0.0;
    let mut sum_y = 0.0;
    let mut sum_xx = 0.0;
    let mut sum_xy = 0.0;
    let k = tail.len() as f64;

    for (i, population) in tail.iter().enumerate() {
        let x = ((i + 1) as f64).ln();
        let y = population.ln();
        sum_x += x;
        sum_y += y;
        sum_xx += x * x;
        sum_xy += x * y;
    }

    let denom = k * sum_xx - sum_x * sum_x;
    if denom.abs() < 1e-12 {
        return 0.0;
    }

    (k * sum_xy - sum_x * sum_y) / denom
}

pub fn calculate_correlation(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.len() < 2 {
        return 0.0;
    }
    let n = x.len() as f64;
    let mean_x = x.iter().sum::<f64>() / n;
    let mean_y = y.iter().sum::<f64>() / n;

    let mut cov = 0.0;
    let mut var_x = 0.0;
    let mut var_y = 0.0;

    for i in 0..x.len() {
        let dx = x[i] - mean_x;
        let dy = y[i] - mean_y;
        cov += dx * dy;
        var_x += dx * dx;
        var_y += dy * dy;
    }

    let denom = (var_x * var_y).sqrt();
    if denom < 1e-12 {
        0.0
    } else {
        cov / denom
    }
}

#[cfg(test)]
mod tests {
    use super::calculate_zipf_slope;

    #[test]
    fn zipf_two_positive_pops_no_panic() {
        let _ = calculate_zipf_slope(&[3.0, 7.0]);
    }
}
