use crate::types::StreakResult;
use napi_derive::napi;

const MS_PER_DAY: f64 = 86_400_000.0;

/// Convert a timestamp in ms to the number of days since Unix epoch.
fn to_day(timestamp_ms: f64) -> i64 {
    #[allow(clippy::cast_possible_truncation)]
    let day = (timestamp_ms / MS_PER_DAY).floor() as i64;
    day
}

/// Calculate streak multiplier: 1.0 + min(streak, 7) * 0.1, capped at 1.7.
fn streak_multiplier(streak: i32) -> f64 {
    let capped = streak.min(7);
    1.0 + f64::from(capped) * 0.1
}

/// Evaluate streak based on activity timestamps.
///
/// Rules:
/// - Same day -> unchanged
/// - Yesterday -> streak + 1
/// - Gap > 1 day -> reset to 1
/// - No previous activity (`last_activity_ms` < 0) -> start at 1
#[napi]
#[allow(clippy::must_use_candidate)]
pub fn evaluate_streak(
    last_activity_ms: f64,
    current_ms: f64,
    current_streak: i32,
    longest_streak: i32,
) -> StreakResult {
    if last_activity_ms < 0.0 {
        return StreakResult {
            current_streak: 1,
            longest_streak: longest_streak.max(1),
            multiplier: streak_multiplier(1),
        };
    }

    let last_day = to_day(last_activity_ms);
    let current_day = to_day(current_ms);
    let diff = current_day - last_day;

    match diff {
        0 => StreakResult {
            current_streak,
            longest_streak,
            multiplier: streak_multiplier(current_streak),
        },
        1 => {
            let new_streak = current_streak + 1;
            let new_longest = longest_streak.max(new_streak);
            StreakResult {
                current_streak: new_streak,
                longest_streak: new_longest,
                multiplier: streak_multiplier(new_streak),
            }
        }
        _ => StreakResult {
            current_streak: 1,
            longest_streak,
            multiplier: streak_multiplier(1),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const DAY_MS: f64 = 86_400_000.0;
    const BASE_TS: f64 = 1_700_000_000_000.0;

    #[test]
    fn test_same_day_unchanged() {
        let result = evaluate_streak(BASE_TS, BASE_TS + 1000.0, 3, 5);
        assert_eq!(result.current_streak, 3);
        assert_eq!(result.longest_streak, 5);
    }

    #[test]
    fn test_yesterday_increments() {
        let result = evaluate_streak(BASE_TS, BASE_TS + DAY_MS, 3, 5);
        assert_eq!(result.current_streak, 4);
        assert_eq!(result.longest_streak, 5);
    }

    #[test]
    fn test_gap_resets() {
        let result = evaluate_streak(BASE_TS, BASE_TS + 3.0 * DAY_MS, 5, 10);
        assert_eq!(result.current_streak, 1);
        assert_eq!(result.longest_streak, 10);
    }

    #[test]
    fn test_no_previous_activity() {
        let result = evaluate_streak(-1.0, BASE_TS, 0, 0);
        assert_eq!(result.current_streak, 1);
        assert_eq!(result.longest_streak, 1);
    }

    #[test]
    fn test_multiplier_cap() {
        let result = evaluate_streak(BASE_TS, BASE_TS + DAY_MS, 9, 9);
        assert_eq!(result.current_streak, 10);
        // min(10, 7) * 0.1 + 1.0 = 1.7
        assert!((result.multiplier - 1.7).abs() < 1e-10);
    }

    #[test]
    fn test_yesterday_updates_longest() {
        let result = evaluate_streak(BASE_TS, BASE_TS + DAY_MS, 5, 5);
        assert_eq!(result.current_streak, 6);
        assert_eq!(result.longest_streak, 6);
    }
}
