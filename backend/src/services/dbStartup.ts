const DEFAULT_USER_PASSWORD = "ChangeMe123";

const TBL_users = [
  {
    id: "uid_chang",
    email: "chang@gmail.com",
    password: DEFAULT_USER_PASSWORD,
    displayName: "Chang",
  },
  {
    id: "uid_ryan",
    email: "ryan@gmail.com",
    password: DEFAULT_USER_PASSWORD,
    displayName: "Ryan",
  },
  {
    id: "uid_anthony",
    email: "anthony@gmail.com",
    password: DEFAULT_USER_PASSWORD,
    displayName: "Anthony",
  },
  {
    id: "uid_wilson",
    email: "wilson@gmail.com",
    password: DEFAULT_USER_PASSWORD,
    displayName: "Wilson",
  },
  {
    id: "uid_friendless",
    email: "friendless@gmail.com",
    password: DEFAULT_USER_PASSWORD,
    displayName: "Friendless",
  },
];

const TBL_friends = [
  { user1_id: "uid_chang", user2_id: "uid_ryan" },
  { user1_id: "uid_chang", user2_id: "uid_anthony" },
  { user1_id: "uid_chang", user2_id: "uid_wilson" },
  { user1_id: "uid_ryan", user2_id: "uid_anthony" },
  { user1_id: "uid_ryan", user2_id: "uid_wilson" },
  { user1_id: "uid_anthony", user2_id: "uid_wilson" },
];

const TBL_friend_requests = [
  {
    from_user_id: "uid_friendless",
    to_user_id: "uid_chang",
  },
  {
    from_user_id: "uid_friendless",
    to_user_id: "uid_anthony",
  },
  {
    from_user_id: "uid_friendless",
    to_user_id: "uid_wilson",
  },
];

const TBL_bet_groups = [
  {
    id: "bgid_1",
    name: "Cool Kids",
    description: "A group for cool kids to place bets.",
    owner_id: "uid_chang",
  },
];

const TBL_bet_participants = [
  { bet_group_id: "bgid_1", user_id: "uid_chang" },
  { bet_group_id: "bgid_1", user_id: "uid_anthony" },
  { bet_group_id: "bgid_1", user_id: "uid_wilson" },
];
