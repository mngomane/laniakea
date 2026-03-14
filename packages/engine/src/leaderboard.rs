use crate::types::{LeaderboardEntry, TeamStats};
use napi_derive::napi;

/// Sort leaderboard entries by XP descending, tie-break by streak descending.
/// Assigns rank starting from 1.
#[napi]
#[allow(clippy::must_use_candidate)]
pub fn sort_leaderboard(mut entries: Vec<LeaderboardEntry>) -> Vec<LeaderboardEntry> {
    entries.sort_by(|a, b| {
        b.xp.cmp(&a.xp)
            .then_with(|| b.current_streak.cmp(&a.current_streak))
    });

    for (i, entry) in entries.iter_mut().enumerate() {
        #[allow(clippy::cast_possible_truncation, clippy::cast_possible_wrap)]
        let rank = (i + 1) as i32;
        entry.rank = rank;
    }

    entries
}

/// Calculate aggregated statistics for a team from member XP data.
#[napi]
#[allow(clippy::needless_pass_by_value, clippy::must_use_candidate)]
pub fn calculate_team_stats(member_xps: Vec<i64>, weekly_xps: Vec<i64>) -> TeamStats {
    let member_count = member_xps.len();
    let total_xp: i64 = member_xps.iter().sum();
    #[allow(clippy::cast_possible_truncation, clippy::cast_possible_wrap)]
    let count_i32 = member_count as i32;
    #[allow(clippy::cast_possible_wrap)]
    let average_xp = if member_count > 0 {
        total_xp / member_count as i64
    } else {
        0
    };
    let weekly_xp: i64 = weekly_xps.iter().sum();

    TeamStats {
        total_xp,
        member_count: count_i32,
        average_xp,
        weekly_xp,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_entry(user_id: &str, username: &str, xp: i32, streak: i32) -> LeaderboardEntry {
        LeaderboardEntry {
            user_id: user_id.to_string(),
            username: username.to_string(),
            xp,
            level: 1,
            current_streak: streak,
            rank: 0,
        }
    }

    #[test]
    fn test_sorted_by_xp_desc() {
        let entries = vec![
            make_entry("1", "alice", 100, 1),
            make_entry("2", "bob", 300, 1),
            make_entry("3", "carol", 200, 1),
        ];
        let result = sort_leaderboard(entries);
        assert_eq!(result[0].username, "bob");
        assert_eq!(result[1].username, "carol");
        assert_eq!(result[2].username, "alice");
    }

    #[test]
    fn test_ranks_assigned() {
        let entries = vec![
            make_entry("1", "alice", 100, 1),
            make_entry("2", "bob", 200, 1),
        ];
        let result = sort_leaderboard(entries);
        assert_eq!(result[0].rank, 1);
        assert_eq!(result[1].rank, 2);
    }

    #[test]
    fn test_tie_break_by_streak() {
        let entries = vec![
            make_entry("1", "alice", 100, 3),
            make_entry("2", "bob", 100, 7),
        ];
        let result = sort_leaderboard(entries);
        assert_eq!(result[0].username, "bob");
        assert_eq!(result[1].username, "alice");
    }

    #[test]
    fn test_empty_leaderboard() {
        let result = sort_leaderboard(vec![]);
        assert!(result.is_empty());
    }

    #[test]
    fn test_team_stats_empty() {
        let stats = calculate_team_stats(vec![], vec![]);
        assert_eq!(stats.total_xp, 0);
        assert_eq!(stats.member_count, 0);
        assert_eq!(stats.average_xp, 0);
        assert_eq!(stats.weekly_xp, 0);
    }

    #[test]
    fn test_team_stats_single_member() {
        let stats = calculate_team_stats(vec![500], vec![100]);
        assert_eq!(stats.total_xp, 500);
        assert_eq!(stats.member_count, 1);
        assert_eq!(stats.average_xp, 500);
        assert_eq!(stats.weekly_xp, 100);
    }

    #[test]
    fn test_team_stats_multiple_members() {
        let stats = calculate_team_stats(vec![100, 200, 300], vec![10, 20, 30]);
        assert_eq!(stats.total_xp, 600);
        assert_eq!(stats.member_count, 3);
        assert_eq!(stats.average_xp, 200);
        assert_eq!(stats.weekly_xp, 60);
    }

    #[test]
    fn test_team_stats_zero_weekly() {
        let stats = calculate_team_stats(vec![1000, 2000], vec![0, 0]);
        assert_eq!(stats.total_xp, 3000);
        assert_eq!(stats.member_count, 2);
        assert_eq!(stats.average_xp, 1500);
        assert_eq!(stats.weekly_xp, 0);
    }
}
