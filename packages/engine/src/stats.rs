use crate::types::GlobalStats;
use napi_derive::napi;

/// Calculate global platform statistics from aggregated values.
#[napi]
#[allow(clippy::must_use_candidate)]
pub fn calculate_global_stats(
    user_count: i32,
    total_xp: i64,
    total_activities: i64,
    team_count: i32,
    level_sum: f64,
) -> GlobalStats {
    let average_level = if user_count > 0 {
        level_sum / f64::from(user_count)
    } else {
        0.0
    };

    GlobalStats {
        total_users: user_count,
        total_xp,
        total_activities,
        total_teams: team_count,
        average_level,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_global_stats_basic() {
        let stats = calculate_global_stats(10, 50000, 200, 3, 45.0);
        assert_eq!(stats.total_users, 10);
        assert_eq!(stats.total_xp, 50000);
        assert_eq!(stats.total_activities, 200);
        assert_eq!(stats.total_teams, 3);
        assert!((stats.average_level - 4.5).abs() < f64::EPSILON);
    }

    #[test]
    fn test_global_stats_no_users() {
        let stats = calculate_global_stats(0, 0, 0, 0, 0.0);
        assert_eq!(stats.total_users, 0);
        assert!((stats.average_level - 0.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_global_stats_single_user() {
        let stats = calculate_global_stats(1, 1000, 50, 1, 5.0);
        assert_eq!(stats.total_users, 1);
        assert!((stats.average_level - 5.0).abs() < f64::EPSILON);
    }
}
