-- Migration: Create UserProfile and Leaderboard views and score function

-- Score function
CREATE OR REPLACE FUNCTION user_score(success_rate NUMERIC, successful_bets INT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN 3 * success_rate + successful_bets;
END;
$$ LANGUAGE plpgsql;

-- UserProfile View
CREATE OR REPLACE VIEW user_profile AS
SELECT
  u.id,
  u.display_name AS "displayName",
  u.profile_image AS "profilePicture",
  u.banner_image AS "bannerImage",
  COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0) AS "totalBets",
  COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0) AS "successfulBets",
  CASE WHEN SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) > 0
    THEN ROUND(
      SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END)::NUMERIC /
      SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END)::NUMERIC, 2)
    ELSE 0 END AS "successRate",
  COALESCE(SUM(b.points_reward), 0) AS "points",
  ARRAY(SELECT bg.name FROM bet_groups bg JOIN bet_group_members bgm ON bg.id = bgm.group_id WHERE bgm.user_id = u.id) AS "friendGroups"
FROM users u
LEFT JOIN bets b ON b.creator_id = u.id
GROUP BY u.id, u.display_name, u.profile_image, u.banner_image;

-- Leaderboard View
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  up.displayName,
  RANK() OVER (ORDER BY user_score(up.successRate, up.successfulBets) DESC) AS leaderboardRank,
  user_score(up.successRate, up.successfulBets) AS score,
  up.successRate,
  up.successfulBets,
  up.totalBets
FROM user_profile up;
