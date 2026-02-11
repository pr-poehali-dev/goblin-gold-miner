-- Таблица игроков
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    memo_code VARCHAR(6) UNIQUE NOT NULL,
    goblins INTEGER DEFAULT 3000,
    gold DECIMAL(10, 2) DEFAULT 0,
    ton_balance DECIMAL(10, 4) DEFAULT 0,
    last_harvest TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска по user_id и memo
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_memo ON players(memo_code);

-- Таблица P2P объявлений
CREATE TABLE IF NOT EXISTS market_listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES players(id),
    gold_amount DECIMAL(10, 2) NOT NULL CHECK (gold_amount >= 100),
    price_per_kg DECIMAL(10, 4) NOT NULL,
    total_price DECIMAL(10, 4) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для активных объявлений
CREATE INDEX IF NOT EXISTS idx_market_active ON market_listings(status, created_at DESC);

-- Таблица транзакций
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 4) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для истории транзакций игрока
CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id, created_at DESC);

-- Таблица для отслеживания автоначислений золота
CREATE TABLE IF NOT EXISTS gold_harvests (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    gold_earned DECIMAL(10, 2) NOT NULL,
    goblins_count INTEGER NOT NULL,
    harvested_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для истории начислений
CREATE INDEX IF NOT EXISTS idx_harvests_player ON gold_harvests(player_id, harvested_at DESC);