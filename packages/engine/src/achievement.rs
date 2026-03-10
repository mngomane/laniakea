use crate::types::{AchievementCheck, AchievementDef, AchievementStatus};
use napi_derive::napi;

/// Check which achievements are unlocked given definitions and current counts.
///
/// `current_counts` is a parallel array to `definitions` with the user's current
/// progress count for each achievement.
#[napi]
#[allow(clippy::needless_pass_by_value, clippy::must_use_candidate)]
pub fn check_achievements(
    definitions: Vec<AchievementDef>,
    current_counts: Vec<i32>,
) -> AchievementCheck {
    let mut newly_unlocked = Vec::new();
    let mut all_statuses = Vec::new();

    for (def, &count) in definitions.iter().zip(current_counts.iter()) {
        let progress = if def.required_count > 0 {
            f64::from(count.min(def.required_count)) / f64::from(def.required_count)
        } else {
            1.0
        };
        let unlocked = count >= def.required_count;

        let status = AchievementStatus {
            slug: def.slug.clone(),
            name: def.name.clone(),
            unlocked,
            progress,
        };

        if unlocked {
            newly_unlocked.push(status.clone());
        }
        all_statuses.push(status);
    }

    AchievementCheck {
        newly_unlocked,
        all_statuses,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_defs() -> Vec<AchievementDef> {
        vec![
            AchievementDef {
                slug: "first-commit".to_string(),
                name: "First Commit".to_string(),
                description: "Make your first commit".to_string(),
                required_count: 1,
            },
            AchievementDef {
                slug: "ten-commits".to_string(),
                name: "Commit Streak".to_string(),
                description: "Make 10 commits".to_string(),
                required_count: 10,
            },
            AchievementDef {
                slug: "reviewer".to_string(),
                name: "Reviewer".to_string(),
                description: "Review 5 PRs".to_string(),
                required_count: 5,
            },
        ]
    }

    #[test]
    fn test_no_achievements_unlocked() {
        let result = check_achievements(test_defs(), vec![0, 0, 0]);
        assert!(result.newly_unlocked.is_empty());
        assert_eq!(result.all_statuses.len(), 3);
        assert!((result.all_statuses[0].progress - 0.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_one_achievement_unlocked() {
        let result = check_achievements(test_defs(), vec![1, 3, 0]);
        assert_eq!(result.newly_unlocked.len(), 1);
        assert_eq!(result.newly_unlocked[0].slug, "first-commit");
        assert!((result.all_statuses[1].progress - 0.3).abs() < f64::EPSILON);
    }

    #[test]
    fn test_all_achievements_unlocked() {
        let result = check_achievements(test_defs(), vec![1, 15, 5]);
        assert_eq!(result.newly_unlocked.len(), 3);
        assert!(result.all_statuses.iter().all(|s| s.unlocked));
    }

    #[test]
    fn test_progress_capped_at_one() {
        let result = check_achievements(test_defs(), vec![100, 0, 0]);
        assert!((result.all_statuses[0].progress - 1.0).abs() < f64::EPSILON);
    }
}
