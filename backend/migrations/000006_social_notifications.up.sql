CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_low_id UUID GENERATED ALWAYS AS (LEAST(user_id, friend_id)) STORED,
  user_high_id UUID GENERATED ALWAYS AS (GREATEST(user_id, friend_id)) STORED,
  status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'blocked', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id <> friend_id),
  UNIQUE(user_id, friend_id),
  UNIQUE(user_low_id, user_high_id)
);

CREATE INDEX idx_friends_user_status ON friends(user_id, status);
CREATE INDEX idx_friends_friend_status ON friends(friend_id, status);

CREATE TRIGGER trg_friends_updated_at
BEFORE UPDATE ON friends
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE neighbor_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(32) NOT NULL CHECK (action_type IN ('help', 'prank')),
  action_code VARCHAR(64) NOT NULL,
  effect JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_user_id <> to_user_id)
);

CREATE INDEX idx_neighbor_actions_from_created
ON neighbor_actions(from_user_id, created_at DESC);

CREATE INDEX idx_neighbor_actions_to_created
ON neighbor_actions(to_user_id, created_at DESC);

CREATE INDEX idx_neighbor_actions_type_created
ON neighbor_actions(action_type, created_at DESC);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created
ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_user_unread
ON notifications(user_id, created_at DESC)
WHERE read_at IS NULL;
