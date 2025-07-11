-- Migration: Create friends table for friend relationships
-- Run this script to create the friends table and related functionality

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invite_code VARCHAR(20) UNIQUE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, friend_id)
);

-- Create friend invitations table for tracking invite codes
CREATE TABLE IF NOT EXISTS friend_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    max_uses INTEGER DEFAULT 10,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_status ON friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_invite_code ON friends(invite_code);
CREATE INDEX IF NOT EXISTS idx_friend_invitations_code ON friend_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_friend_invitations_created_by ON friend_invitations(created_by);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_friends_timestamp 
    BEFORE UPDATE ON friends 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_invitations_timestamp 
    BEFORE UPDATE ON friend_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_friend_invite_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM friend_invitations WHERE invite_code = code) THEN
            RETURN code;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique invite code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create friend invitation
CREATE OR REPLACE FUNCTION create_friend_invitation(
    p_created_by UUID,
    p_max_uses INTEGER DEFAULT 10,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VARCHAR(20) AS $$
DECLARE
    invite_code VARCHAR(20);
BEGIN
    -- Generate unique invite code
    invite_code := generate_friend_invite_code();
    
    -- Create invitation record
    INSERT INTO friend_invitations (
        invite_code,
        created_by,
        max_uses,
        expires_at
    ) VALUES (
        invite_code,
        p_created_by,
        p_max_uses,
        COALESCE(p_expires_at, NOW() + INTERVAL '7 days')
    );
    
    RETURN invite_code;
END;
$$ LANGUAGE plpgsql;

-- Function to accept friend invitation
CREATE OR REPLACE FUNCTION accept_friend_invitation(
    p_invite_code VARCHAR(20),
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record RECORD;
    friend_record RECORD;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record 
    FROM friend_invitations 
    WHERE invite_code = p_invite_code 
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;
    
    -- Check if invitation is expired
    IF invitation_record.expires_at < NOW() THEN
        RAISE EXCEPTION 'Invitation has expired';
    END IF;
    
    -- Check if max uses reached
    IF invitation_record.current_uses >= invitation_record.max_uses THEN
        RAISE EXCEPTION 'Invitation usage limit reached';
    END IF;
    
    -- Check if user is trying to add themselves
    IF invitation_record.created_by = p_user_id THEN
        RAISE EXCEPTION 'Cannot add yourself as a friend';
    END IF;
    
    -- Check if friendship already exists
    IF EXISTS (
        SELECT 1 FROM friends 
        WHERE (user_id = invitation_record.created_by AND friend_id = p_user_id)
        OR (user_id = p_user_id AND friend_id = invitation_record.created_by)
    ) THEN
        RAISE EXCEPTION 'Friendship already exists';
    END IF;
    
    -- Create bidirectional friendship
    INSERT INTO friends (user_id, friend_id, status, invited_by, invite_code, accepted_at)
    VALUES 
        (invitation_record.created_by, p_user_id, 'ACCEPTED', invitation_record.created_by, p_invite_code, NOW()),
        (p_user_id, invitation_record.created_by, 'ACCEPTED', invitation_record.created_by, p_invite_code, NOW());
    
    -- Update invitation usage count
    UPDATE friend_invitations 
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE invite_code = p_invite_code;
    
    -- Deactivate invitation if max uses reached
    IF invitation_record.current_uses + 1 >= invitation_record.max_uses THEN
        UPDATE friend_invitations 
        SET is_active = FALSE,
            updated_at = NOW()
        WHERE invite_code = p_invite_code;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own friend relationships" ON friends 
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id OR auth.role() = 'service_role');

CREATE POLICY "Users can manage their own friend relationships" ON friends 
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id OR auth.role() = 'service_role');

CREATE POLICY "Users can view their own invitations" ON friend_invitations 
    FOR SELECT USING (auth.uid() = created_by OR auth.role() = 'service_role');

CREATE POLICY "Users can manage their own invitations" ON friend_invitations 
    FOR ALL USING (auth.uid() = created_by OR auth.role() = 'service_role');

-- Success message
SELECT 'Friends table and related functionality created successfully!' as status; 