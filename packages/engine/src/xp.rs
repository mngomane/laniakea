use crate::types::{ActivityType, LevelInfo, XpResult};
use napi_derive::napi;

/// Base XP values for each activity type.
fn base_xp_for(activity: &ActivityType) -> i32 {
    match activity {
        ActivityType::Commit => 10,
        ActivityType::PullRequest => 25,
        ActivityType::Review => 20,
        ActivityType::Issue => 15,
        ActivityType::Merge => 30,
    }
}

/// Calculate XP earned for an activity, applying streak multiplier.
#[napi]
#[allow(clippy::needless_pass_by_value, clippy::must_use_candidate)]
pub fn calculate_xp(activity_type: ActivityType, streak_multiplier: f64) -> XpResult {
    let base = base_xp_for(&activity_type);
    let multiplier = if streak_multiplier > 0.0 {
        streak_multiplier
    } else {
        1.0
    };
    #[allow(clippy::cast_possible_truncation)]
    let total = (f64::from(base) * multiplier).round() as i32;

    XpResult {
        base_xp: base,
        multiplier,
        total_xp: total,
    }
}

/// Calculate level from total XP.
/// Formula: level = floor(0.1 * `sqrt(total_xp)`) + 1
#[napi]
#[allow(clippy::must_use_candidate)]
pub fn calculate_level(total_xp: i32) -> LevelInfo {
    let xp = total_xp.max(0);
    #[allow(clippy::cast_possible_truncation)]
    let level = (0.1 * f64::from(xp).sqrt()).floor() as i32 + 1;
    let xp_for_current = xp_for_level(level);
    let xp_for_next = xp_for_level(level + 1);

    LevelInfo {
        level,
        total_xp: xp,
        xp_for_current_level: xp_for_current,
        xp_for_next_level: xp_for_next,
    }
}

/// Calculate the total XP required to reach a given level.
/// Inverse of level formula: xp = ((level - 1) / 0.1)^2
fn xp_for_level(level: i32) -> i32 {
    let l = (level - 1).max(0);
    #[allow(clippy::cast_possible_truncation)]
    let xp = (f64::from(l) / 0.1).powi(2) as i32;
    xp
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_commit_xp_no_streak() {
        let result = calculate_xp(ActivityType::Commit, 1.0);
        assert_eq!(result.base_xp, 10);
        assert!((result.multiplier - 1.0).abs() < f64::EPSILON);
        assert_eq!(result.total_xp, 10);
    }

    #[test]
    fn test_pr_xp_with_streak() {
        let result = calculate_xp(ActivityType::PullRequest, 1.5);
        assert_eq!(result.base_xp, 25);
        assert_eq!(result.total_xp, 38); // 25 * 1.5 = 37.5 -> 38
    }

    #[test]
    fn test_merge_xp() {
        let result = calculate_xp(ActivityType::Merge, 1.0);
        assert_eq!(result.base_xp, 30);
        assert_eq!(result.total_xp, 30);
    }

    #[test]
    fn test_zero_multiplier_defaults_to_one() {
        let result = calculate_xp(ActivityType::Commit, 0.0);
        assert_eq!(result.total_xp, 10);
    }

    #[test]
    fn test_level_1_at_zero_xp() {
        let info = calculate_level(0);
        assert_eq!(info.level, 1);
    }

    #[test]
    fn test_level_2_at_100_xp() {
        let info = calculate_level(100);
        assert_eq!(info.level, 2); // floor(0.1 * sqrt(100)) + 1 = floor(1.0) + 1 = 2
    }

    #[test]
    fn test_level_at_10000_xp() {
        let info = calculate_level(10000);
        assert_eq!(info.level, 11); // floor(0.1 * 100) + 1 = 11
    }

    #[test]
    fn test_negative_xp_clamped() {
        let info = calculate_level(-50);
        assert_eq!(info.level, 1);
        assert_eq!(info.total_xp, 0);
    }
}
