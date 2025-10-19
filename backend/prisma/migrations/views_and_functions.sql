-- Migration: Create UserProfile and Leaderboard views and score function

-- Score function
CREATE OR REPLACE FUNCTION user_score(successful_bets INT, total_bets INT)
RETURNS INT AS $$
DECLARE
  failed_bets INT;
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



-- Global Leaderboard View
CREATE OR REPLACE VIEW leaderboard_global AS
SELECT
  up.id AS user_id,
  up."displayName",
  up."profileImage",
  RANK() OVER (ORDER BY user_score(up."successfulBets"::INT, up."totalBets"::INT) DESC) AS leaderboardRank,
  user_score(up."successfulBets"::INT, up."totalBets"::INT) AS score,
  up."successRate",
  up."successfulBets",
  up."totalBets"
FROM user_profile up;



-- Leaderboard for a user's friends (including user)
-- Usage: SELECT * FROM leaderboard_friends WHERE owner_id = '<uid>';
CREATE OR REPLACE VIEW leaderboard_friends AS
SELECT
  owner.id AS owner_id,
  up.id AS friend_id,
  up."displayName",
  up."profileImage",
  RANK() OVER (PARTITION BY owner.id ORDER BY user_score(up."successfulBets"::INT, up."totalBets"::INT) DESC) AS leaderboardRank,
  user_score(up."successfulBets"::INT, up."totalBets"::INT) AS score,
  up."successRate",
  up."successfulBets",
  up."totalBets"
FROM users owner
JOIN (
  SELECT u.id, u.display_name AS "displayName", u.profile_image AS "profileImage", u.banner_image,
         COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0) AS "totalBets",
         COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0) AS "successfulBets",
         CASE WHEN SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) > 0
           THEN ROUND(
             SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END)::NUMERIC /
             SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END)::NUMERIC, 2)
           ELSE 0 END AS "successRate"
  FROM users u
  LEFT JOIN bets b ON b.creator_id = u.id
  GROUP BY u.id, u.display_name, u.profile_image, u.banner_image
) up ON up.id IN (
  SELECT f.user2_id FROM friendships f WHERE f.user1_id = owner.id
  UNION
  SELECT f.user1_id FROM friendships f WHERE f.user2_id = owner.id
  UNION
  SELECT owner.id -- include self
);



-- Leaderboard for a specific group
-- Usage: SELECT * FROM leaderboard_group WHERE group_id = '<groupId>';
CREATE OR REPLACE VIEW leaderboard_group AS
SELECT
  bgm.user_id AS member_id,
  up."displayName",
  up."profileImage",
  bgm.group_id,
  RANK() OVER (PARTITION BY bgm.group_id ORDER BY user_score(up."successfulBets"::INT, up."totalBets"::INT) DESC) AS leaderboardRank,
  user_score(up."successfulBets"::INT, up."totalBets"::INT) AS score,
  up."successRate",
  up."successfulBets",
  up."totalBets"
FROM bet_group_members bgm
JOIN (
  SELECT u.id, u.display_name AS "displayName", u.profile_image AS "profileImage", u.banner_image,
         COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0) AS "totalBets",
         COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END), 0) AS "successfulBets",
         CASE WHEN SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) > 0
           THEN ROUND(
             SUM(CASE WHEN b.status = 'completed' AND b.points_reward > 0 THEN 1 ELSE 0 END)::NUMERIC /
             SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END)::NUMERIC, 2)
           ELSE 0 END AS "successRate"
  FROM users u
  LEFT JOIN bets b ON b.creator_id = u.id
  GROUP BY u.id, u.display_name, u.profile_image, u.banner_image
) up ON up.id = bgm.user_id;
