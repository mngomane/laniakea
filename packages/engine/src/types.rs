use napi_derive::napi;

/// Types of developer activities that earn XP.
#[napi(string_enum)]
pub enum ActivityType {
    Commit,
    PullRequest,
    Review,
    Issue,
    Merge,
}

/// Result of an XP calculation.
#[napi(object)]
#[derive(Debug, Clone)]
pub struct XpResult {
    pub base_xp: i32,
    pub multiplier: f64,
    pub total_xp: i32,
}

/// Information about the user's current level.
#[napi(object)]
#[derive(Debug, Clone)]
pub struct LevelInfo {
    pub level: i32,
    pub total_xp: i32,
    pub xp_for_current_level: i32,
    pub xp_for_next_level: i32,
}

/// Result of a streak evaluation.
#[napi(object)]
#[derive(Debug, Clone)]
pub struct StreakResult {
    pub current_streak: i32,
    pub longest_streak: i32,
    pub multiplier: f64,
}

/// Definition of an achievement.
#[napi(object)]
#[derive(Debug, Clone)]
pub struct AchievementDef {
    pub slug: String,
    pub name: String,
    pub description: String,
    pub required_count: i32,
}

/// Result of checking a single achievement.
#[napi(object)]
#[derive(Debug, Clone)]
pub struct AchievementStatus {
    pub slug: String,
    pub name: String,
    pub unlocked: bool,
    pub progress: f64,
}

/// Result of checking all achievements.
#[napi(object)]
#[derive(Debug, Clone)]
pub struct AchievementCheck {
    pub newly_unlocked: Vec<AchievementStatus>,
    pub all_statuses: Vec<AchievementStatus>,
}

/// An entry in the leaderboard.
#[napi(object)]
#[derive(Debug, Clone)]
pub struct LeaderboardEntry {
    pub user_id: String,
    pub username: String,
    pub xp: i32,
    pub level: i32,
    pub current_streak: i32,
    pub rank: i32,
}

/// Aggregated statistics for a team.
#[napi(object)]
#[derive(Debug, Clone)]
pub struct TeamStats {
    pub total_xp: i64,
    pub member_count: i32,
    pub average_xp: i64,
    pub weekly_xp: i64,
}

/// Global platform statistics (admin).
#[napi(object)]
#[derive(Debug, Clone)]
pub struct GlobalStats {
    pub total_users: i32,
    pub total_xp: i64,
    pub total_activities: i64,
    pub total_teams: i32,
    pub average_level: f64,
}
