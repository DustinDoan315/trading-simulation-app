-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users read access" ON users FOR SELECT USING (auth.uid() = uuid);
CREATE POLICY "Users insert access" ON users FOR INSERT WITH CHECK (auth.uid() = uuid);
CREATE POLICY "Users update access" ON users FOR UPDATE USING (auth.uid() = uuid);

-- Portfolios table policies
CREATE POLICY "Portfolios read access" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Portfolios insert access" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Portfolios update access" ON portfolios FOR UPDATE USING (auth.uid() = user_id);

-- Transactions table policies
CREATE POLICY "Transactions read access" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Transactions insert access" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Transactions update access" ON transactions FOR UPDATE USING (auth.uid() = user_id);

-- Collections table policies
CREATE POLICY "Collections read access" ON collections FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Collections insert access" ON collections FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Collections update access" ON collections FOR UPDATE USING (auth.uid() = owner_id);
