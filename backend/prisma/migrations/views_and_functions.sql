-- Drop views if they exist to avoid column rename errors
DROP VIEW IF EXISTS user_profile CASCADE;
DROP VIEW IF EXISTS leaderboard_global CASCADE;
DROP VIEW IF EXISTS leaderboard_friends CASCADE;
DROP VIEW IF EXISTS leaderboard_group CASCADE;
-- Migration: Create UserProfile and Leaderboard views and score function

-- Score function
CREATE OR REPLACE FUNCTION user_score(successful_bets BIGINT, total_bets BIGINT)
RETURNS INT AS $$
DECLARE
  failed_bets BIGINT;
BEGIN
  failed_bets := total_bets - successful_bets;
  RETURN 3 * successful_bets - 2 * failed_bets;
END;
$$ LANGUAGE plpgsql;

-- UserProfile View
CREATE OR REPLACE VIEW user_profile AS
SELECT
  u.id,
  u.display_name AS "displayName",
  u.profile_image AS "profileImage",
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




CREATE OR REPLACE VIEW leaderboard_global AS
SELECT
  u.id AS user_id,
  u.display_name AS "displayName",
  u.profile_image AS "profileImage",
  RANK() OVER (ORDER BY COALESCE(user_score(
    COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0)
  ), 0) DESC) AS "leaderboardRank",
  COALESCE(user_score(
    COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0)
  ), 0) AS score,
  CASE WHEN SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) > 0
    THEN ROUND(
      SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END)::NUMERIC /
      SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END)::NUMERIC, 2)
    ELSE 0 END AS "successRate",
  COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0) AS "successfulBets",
  COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0) AS "totalBets"
FROM users u
LEFT JOIN bets b ON b.creator_id = u.id
GROUP BY u.id, u.display_name, u.profile_image;




CREATE OR REPLACE VIEW leaderboard_friends AS
SELECT
  owner.id AS owner_id,
  u.id AS friend_id,
  u.display_name AS "displayName",
  u.profile_image AS "profileImage",
  RANK() OVER (PARTITION BY owner.id ORDER BY COALESCE(user_score(
    COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0)
  ), 0) DESC) AS "leaderboardRank",
  COALESCE(user_score(
    COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0)
  ), 0) AS score,
  CASE WHEN SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) > 0
    THEN ROUND(
      SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END)::NUMERIC /
      SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END)::NUMERIC, 2)
    ELSE 0 END AS "successRate",
  COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0) AS "successfulBets",
  COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0) AS "totalBets"
FROM users owner
JOIN friendships f ON (f.user1_id = owner.id OR f.user2_id = owner.id)
JOIN users u ON (u.id = f.user1_id OR u.id = f.user2_id)
LEFT JOIN bets b ON b.creator_id = u.id
GROUP BY owner.id, u.id, u.display_name, u.profile_image;




CREATE OR REPLACE VIEW leaderboard_group AS
SELECT
  bgm.user_id AS member_id,
  u.display_name AS "displayName",
  u.profile_image AS "profileImage",
  bgm.group_id,
  RANK() OVER (PARTITION BY bgm.group_id ORDER BY COALESCE(user_score(
    COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0)
  ), 0) DESC) AS "leaderboardRank",
  COALESCE(user_score(
    COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0)
  ), 0) AS score,
  CASE WHEN SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) > 0
    THEN ROUND(
      SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END)::NUMERIC /
      SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END)::NUMERIC, 2)
    ELSE 0 END AS "successRate",
  COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0) AS "successfulBets",
  COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0) AS "totalBets"
FROM bet_group_members bgm
JOIN users u ON u.id = bgm.user_id
LEFT JOIN bets b ON b.creator_id = u.id
GROUP BY bgm.user_id, u.display_name, u.profile_image, bgm.group_id;
