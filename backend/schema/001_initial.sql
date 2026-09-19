-- StoneTrail initial PostgreSQL schema.
-- Apply once to an empty database (PostgreSQL 14+).

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums (closed, code-owned). user_role is declared in ascending privilege
-- order so PostgreSQL comparison works: 'editor'::user_role > 'moderator'.
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'user',
    'professional',
    'moderator',
    'editor',
    'admin'
);

-- Maps to frontend ACTIVITY_TYPES (Russian labels) in the API layer.
CREATE TYPE activity_type AS ENUM (
    'architect',
    'designer',
    'stone_processor',
    'supplier',
    'manufacturer',
    'construction_company',
    'installation_company',
    'restorer',
    'other'
);

CREATE TYPE lot_item_status AS ENUM ('in_stock', 'reserved', 'on_order');

CREATE TYPE product_category AS ENUM (
    'slabs',
    'blanks',
    'tiles',
    'paving',
    'custom'
);

CREATE TYPE product_item_kind AS ENUM ('slab', 'blank', 'tile', 'paving');

CREATE TYPE price_type AS ENUM ('on_request', 'fixed');

CREATE TYPE price_unit AS ENUM ('piece', 'm2', 'slab', 'ton');

CREATE TYPE finished_status AS ENUM (
    'in_stock',
    'on_order',
    'in_progress',
    'completed'
);

CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE news_status AS ENUM ('coming_soon', 'draft', 'published');

CREATE TYPE notification_type AS ENUM (
    'community',
    'catalog',
    'article',
    'supplier',
    'system'
);

CREATE TYPE auth_token_type AS ENUM ('verify_email', 'reset_password');

CREATE TYPE custom_group AS ENUM (
    'interior',
    'exterior',
    'facades',
    'architectural',
    'memorial'
);

CREATE TYPE inquiry_status AS ENUM ('new', 'in_progress', 'closed');

CREATE TYPE inquiry_source AS ENUM (
    'contacts',
    'catalog_product',
    'catalog_block',
    'other'
);

CREATE TYPE media_owner AS ENUM (
    'stone',
    'block_lot',
    'block_item',
    'product',
    'product_item',
    'article',
    'news',
    'promotion',
    'user_avatar'
);

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Lookups (admin-editable vocabulary)
-- ---------------------------------------------------------------------------

CREATE TABLE stone_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT stone_types_code_key UNIQUE (code),
    CONSTRAINT stone_types_code_format CHECK (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
    CONSTRAINT stone_types_label_len CHECK (char_length(label) >= 1)
);

CREATE TABLE finishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT finishes_code_key UNIQUE (code),
    CONSTRAINT finishes_code_format CHECK (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
    CONSTRAINT finishes_label_len CHECK (char_length(label) >= 1)
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT applications_code_key UNIQUE (code),
    CONSTRAINT applications_code_format CHECK (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
    CONSTRAINT applications_label_len CHECK (char_length(label) >= 1)
);

CREATE TABLE forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT forum_categories_code_key UNIQUE (code),
    CONSTRAINT forum_categories_code_format CHECK (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
    CONSTRAINT forum_categories_label_len CHECK (char_length(label) >= 1)
);

CREATE TABLE article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT article_categories_code_key UNIQUE (code),
    CONSTRAINT article_categories_code_format CHECK (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
    CONSTRAINT article_categories_label_len CHECK (char_length(label) >= 1)
);

-- ---------------------------------------------------------------------------
-- Users / auth
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL DEFAULT '',
    activity_type activity_type,
    country TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    role user_role NOT NULL DEFAULT 'user',
    marketing_consent BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    CONSTRAINT users_nickname_len CHECK (char_length(nickname) >= 2),
    CONSTRAINT users_first_name_len CHECK (
        first_name = '' OR char_length(first_name) >= 2
    ),
    CONSTRAINT users_last_name_len CHECK (
        last_name = '' OR char_length(last_name) >= 2
    ),
    CONSTRAINT users_website_format CHECK (
        website = '' OR website ~* '^https?://'
    ),
    CONSTRAINT users_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX users_email_alive_key ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX users_nickname_alive_key ON users (nickname) WHERE deleted_at IS NULL;
CREATE INDEX users_role_alive_idx ON users (role) WHERE deleted_at IS NULL;

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT sessions_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX sessions_user_expires_idx ON sessions (user_id, expires_at);

CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type auth_token_type NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT auth_tokens_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX auth_tokens_user_type_created_idx
    ON auth_tokens (user_id, type, created_at DESC);

-- ---------------------------------------------------------------------------
-- Media (S3-compatible object metadata)
-- ---------------------------------------------------------------------------

CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key TEXT NOT NULL,
    public_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INT NOT NULL,
    width_px INT,
    height_px INT,
    alt TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT media_storage_key_key UNIQUE (storage_key),
    CONSTRAINT media_size_positive CHECK (size_bytes > 0),
    CONSTRAINT media_width_positive CHECK (width_px IS NULL OR width_px > 0),
    CONSTRAINT media_height_positive CHECK (height_px IS NULL OR height_px > 0)
);

CREATE TABLE media_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media (id) ON DELETE CASCADE,
    owner_type media_owner NOT NULL,
    owner_id UUID NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT media_links_owner_media_key UNIQUE (owner_type, owner_id, media_id)
);

CREATE UNIQUE INDEX media_links_one_primary_idx
    ON media_links (owner_type, owner_id)
    WHERE is_primary;
CREATE INDEX media_links_owner_idx ON media_links (owner_type, owner_id);

-- ---------------------------------------------------------------------------
-- Catalog: material (not stock)
-- ---------------------------------------------------------------------------

CREATE TABLE stones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    robots_noindex BOOLEAN NOT NULL DEFAULT false,
    name TEXT NOT NULL,
    stone_type_id UUID NOT NULL REFERENCES stone_types (id) ON DELETE RESTRICT,
    quarry TEXT NOT NULL,
    country TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT stones_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT stones_seo_title_len CHECK (
        seo_title IS NULL OR char_length(seo_title) <= 70
    ),
    CONSTRAINT stones_seo_description_len CHECK (
        seo_description IS NULL OR char_length(seo_description) <= 320
    ),
    CONSTRAINT stones_canonical_path_format CHECK (
        canonical_path IS NULL OR canonical_path ~ '^/'
    ),
    CONSTRAINT stones_name_len CHECK (char_length(name) >= 1)
);

CREATE UNIQUE INDEX stones_slug_alive_key ON stones (slug) WHERE deleted_at IS NULL;
CREATE INDEX stones_type_alive_idx ON stones (stone_type_id) WHERE deleted_at IS NULL;
CREATE INDEX stones_name_trgm_idx ON stones USING gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------

CREATE TABLE block_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    robots_noindex BOOLEAN NOT NULL DEFAULT false,
    stone_id UUID NOT NULL REFERENCES stones (id) ON DELETE RESTRICT,
    description TEXT NOT NULL DEFAULT '',
    expert_note TEXT NOT NULL DEFAULT '',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT block_lots_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT block_lots_seo_title_len CHECK (
        seo_title IS NULL OR char_length(seo_title) <= 70
    ),
    CONSTRAINT block_lots_seo_description_len CHECK (
        seo_description IS NULL OR char_length(seo_description) <= 320
    ),
    CONSTRAINT block_lots_canonical_path_format CHECK (
        canonical_path IS NULL OR canonical_path ~ '^/'
    )
);

CREATE UNIQUE INDEX block_lots_slug_alive_key
    ON block_lots (slug) WHERE deleted_at IS NULL;
CREATE INDEX block_lots_stone_alive_idx
    ON block_lots (stone_id) WHERE deleted_at IS NULL;

CREATE TABLE block_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES block_lots (id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    length_mm INT,
    width_mm INT,
    height_mm INT,
    weight_kg NUMERIC(10, 2),
    finish_id UUID REFERENCES finishes (id) ON DELETE RESTRICT,
    status lot_item_status NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT block_items_lot_label_key UNIQUE (lot_id, label),
    CONSTRAINT block_items_label_len CHECK (char_length(label) >= 1),
    CONSTRAINT block_items_length_positive CHECK (length_mm IS NULL OR length_mm > 0),
    CONSTRAINT block_items_width_positive CHECK (width_mm IS NULL OR width_mm > 0),
    CONSTRAINT block_items_height_positive CHECK (height_mm IS NULL OR height_mm > 0),
    CONSTRAINT block_items_weight_positive CHECK (weight_kg IS NULL OR weight_kg > 0)
);

CREATE INDEX block_items_lot_status_idx ON block_items (lot_id, status);

-- ---------------------------------------------------------------------------
-- Products (slabs, blanks, tiles, paving, custom)
-- ---------------------------------------------------------------------------

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    robots_noindex BOOLEAN NOT NULL DEFAULT false,
    category product_category NOT NULL,
    stone_id UUID NOT NULL REFERENCES stones (id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    product_type TEXT,
    custom_group custom_group,
    purpose TEXT,
    price_type price_type NOT NULL DEFAULT 'on_request',
    amount NUMERIC(12, 2),
    currency CHAR(3) NOT NULL DEFAULT 'RUB',
    price_unit price_unit,
    characteristics JSONB NOT NULL DEFAULT '{}'::jsonb,
    height TEXT,
    diameter TEXT,
    format TEXT,
    color TEXT,
    thickness TEXT,
    finish TEXT,
    size TEXT,
    dimensions TEXT,
    expert_note TEXT,
    status finished_status,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT products_seo_title_len CHECK (
        seo_title IS NULL OR char_length(seo_title) <= 70
    ),
    CONSTRAINT products_seo_description_len CHECK (
        seo_description IS NULL OR char_length(seo_description) <= 320
    ),
    CONSTRAINT products_canonical_path_format CHECK (
        canonical_path IS NULL OR canonical_path ~ '^/'
    ),
    CONSTRAINT products_name_len CHECK (char_length(name) >= 1),
    CONSTRAINT products_description_len CHECK (char_length(description) >= 1),
    CONSTRAINT products_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT products_amount_non_negative CHECK (amount IS NULL OR amount >= 0),
    CONSTRAINT products_price_fixed_has_amount CHECK (
        price_type = 'on_request' OR amount IS NOT NULL
    ),
    CONSTRAINT products_characteristics_object CHECK (
        jsonb_typeof(characteristics) = 'object'
    ),
    CONSTRAINT products_custom_required CHECK (
        category <> 'custom'
        OR (
            product_type IS NOT NULL
            AND custom_group IS NOT NULL
            AND status IS NOT NULL
            AND finish IS NOT NULL
        )
    ),
    CONSTRAINT products_custom_group_only CHECK (
        category = 'custom' OR custom_group IS NULL
    )
);

CREATE UNIQUE INDEX products_slug_alive_key
    ON products (slug) WHERE deleted_at IS NULL;
CREATE INDEX products_category_stone_alive_idx
    ON products (category, stone_id) WHERE deleted_at IS NULL;
CREATE INDEX products_custom_group_alive_idx
    ON products (custom_group)
    WHERE category = 'custom' AND deleted_at IS NULL;
CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops);

CREATE TABLE product_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    kind product_item_kind NOT NULL,
    label TEXT NOT NULL,
    length_mm INT,
    width_mm INT,
    thickness_mm INT,
    weight_kg NUMERIC(10, 2),
    finish_id UUID NOT NULL REFERENCES finishes (id) ON DELETE RESTRICT,
    status lot_item_status NOT NULL,
    note TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT product_items_product_label_key UNIQUE (product_id, label),
    CONSTRAINT product_items_label_len CHECK (char_length(label) >= 1),
    CONSTRAINT product_items_length_positive CHECK (length_mm IS NULL OR length_mm > 0),
    CONSTRAINT product_items_width_positive CHECK (width_mm IS NULL OR width_mm > 0),
    CONSTRAINT product_items_thickness_positive CHECK (
        thickness_mm IS NULL OR thickness_mm > 0
    ),
    CONSTRAINT product_items_weight_positive CHECK (weight_kg IS NULL OR weight_kg > 0)
);

CREATE INDEX product_items_product_kind_idx ON product_items (product_id, kind);

CREATE TABLE product_applications (
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications (id) ON DELETE RESTRICT,
    PRIMARY KEY (product_id, application_id)
);

CREATE INDEX product_applications_application_idx
    ON product_applications (application_id);

-- ---------------------------------------------------------------------------
-- Community / content
-- ---------------------------------------------------------------------------

CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    robots_noindex BOOLEAN NOT NULL DEFAULT false,
    title TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES forum_categories (id) ON DELETE RESTRICT,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT forum_posts_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT forum_posts_seo_title_len CHECK (
        seo_title IS NULL OR char_length(seo_title) <= 70
    ),
    CONSTRAINT forum_posts_seo_description_len CHECK (
        seo_description IS NULL OR char_length(seo_description) <= 320
    ),
    CONSTRAINT forum_posts_canonical_path_format CHECK (
        canonical_path IS NULL OR canonical_path ~ '^/'
    ),
    CONSTRAINT forum_posts_title_len CHECK (char_length(title) >= 1),
    CONSTRAINT forum_posts_content_len CHECK (char_length(content) >= 1)
);

CREATE UNIQUE INDEX forum_posts_slug_alive_key
    ON forum_posts (slug) WHERE deleted_at IS NULL;
CREATE INDEX forum_posts_category_created_alive_idx
    ON forum_posts (category_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX forum_posts_author_idx ON forum_posts (author_id);

CREATE TABLE forum_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES forum_posts (id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    body TEXT NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT forum_comments_body_len CHECK (char_length(body) >= 1)
);

CREATE INDEX forum_comments_post_created_idx
    ON forum_comments (post_id, created_at);

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    robots_noindex BOOLEAN NOT NULL DEFAULT false,
    title TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES article_categories (id) ON DELETE RESTRICT,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    read_time_minutes INT NOT NULL,
    author_id UUID REFERENCES users (id) ON DELETE SET NULL,
    publication_status publication_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT articles_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT articles_seo_title_len CHECK (
        seo_title IS NULL OR char_length(seo_title) <= 70
    ),
    CONSTRAINT articles_seo_description_len CHECK (
        seo_description IS NULL OR char_length(seo_description) <= 320
    ),
    CONSTRAINT articles_canonical_path_format CHECK (
        canonical_path IS NULL OR canonical_path ~ '^/'
    ),
    CONSTRAINT articles_title_len CHECK (char_length(title) >= 1),
    CONSTRAINT articles_read_time_positive CHECK (read_time_minutes > 0),
    CONSTRAINT articles_published_has_date CHECK (
        publication_status <> 'published' OR published_at IS NOT NULL
    )
);

CREATE UNIQUE INDEX articles_slug_alive_key
    ON articles (slug) WHERE deleted_at IS NULL;
CREATE INDEX articles_published_idx
    ON articles (category_id, published_at DESC)
    WHERE deleted_at IS NULL AND publication_status = 'published';

CREATE TABLE article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    body TEXT NOT NULL,
    parent_id UUID REFERENCES article_comments (id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT article_comments_body_len CHECK (char_length(body) >= 1),
    CONSTRAINT article_comments_not_self_parent CHECK (parent_id IS DISTINCT FROM id)
);

CREATE INDEX article_comments_article_created_idx
    ON article_comments (article_id, created_at);
CREATE INDEX article_comments_parent_idx ON article_comments (parent_id);

CREATE TABLE industry_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    robots_noindex BOOLEAN NOT NULL DEFAULT false,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    status news_status NOT NULL,
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT industry_news_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT industry_news_seo_title_len CHECK (
        seo_title IS NULL OR char_length(seo_title) <= 70
    ),
    CONSTRAINT industry_news_seo_description_len CHECK (
        seo_description IS NULL OR char_length(seo_description) <= 320
    ),
    CONSTRAINT industry_news_canonical_path_format CHECK (
        canonical_path IS NULL OR canonical_path ~ '^/'
    ),
    CONSTRAINT industry_news_title_len CHECK (char_length(title) >= 1)
);

CREATE UNIQUE INDEX industry_news_slug_alive_key
    ON industry_news (slug) WHERE deleted_at IS NULL;
CREATE INDEX industry_news_status_published_alive_idx
    ON industry_news (status, published_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_path TEXT,
    robots_noindex BOOLEAN NOT NULL DEFAULT false,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT promotions_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT promotions_seo_title_len CHECK (
        seo_title IS NULL OR char_length(seo_title) <= 70
    ),
    CONSTRAINT promotions_seo_description_len CHECK (
        seo_description IS NULL OR char_length(seo_description) <= 320
    ),
    CONSTRAINT promotions_canonical_path_format CHECK (
        canonical_path IS NULL OR canonical_path ~ '^/'
    ),
    CONSTRAINT promotions_title_len CHECK (char_length(title) >= 1)
);

CREATE UNIQUE INDEX promotions_slug_alive_key
    ON promotions (slug) WHERE deleted_at IS NULL;
CREATE INDEX promotions_enabled_expires_alive_idx
    ON promotions (is_enabled, expires_at) WHERE deleted_at IS NULL;

CREATE TABLE article_likes (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, article_id)
);

CREATE INDEX article_likes_article_idx ON article_likes (article_id);

CREATE TABLE news_likes (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    news_id UUID NOT NULL REFERENCES industry_news (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, news_id)
);

CREATE INDEX news_likes_news_idx ON news_likes (news_id);

CREATE TABLE promotion_likes (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    promotion_id UUID NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, promotion_id)
);

CREATE INDEX promotion_likes_promotion_idx ON promotion_likes (promotion_id);

-- ---------------------------------------------------------------------------
-- Notifications / inquiries
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT notifications_entity_pair CHECK (
        (entity_type IS NULL AND entity_id IS NULL)
        OR (entity_type IS NOT NULL AND entity_id IS NOT NULL)
    )
);

CREATE INDEX notifications_user_read_created_idx
    ON notifications (user_id, is_read, created_at DESC);

CREATE TABLE contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email CITEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    stone_id UUID REFERENCES stones (id) ON DELETE SET NULL,
    product_id UUID REFERENCES products (id) ON DELETE SET NULL,
    block_lot_id UUID REFERENCES block_lots (id) ON DELETE SET NULL,
    ref TEXT,
    source inquiry_source NOT NULL DEFAULT 'contacts',
    status inquiry_status NOT NULL DEFAULT 'new',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT contact_inquiries_name_len CHECK (char_length(name) >= 1),
    CONSTRAINT contact_inquiries_message_len CHECK (char_length(message) >= 1)
);

CREATE INDEX contact_inquiries_status_created_alive_idx
    ON contact_inquiries (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX contact_inquiries_email_idx ON contact_inquiries (email);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER stone_types_set_updated_at
    BEFORE UPDATE ON stone_types
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER finishes_set_updated_at
    BEFORE UPDATE ON finishes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER applications_set_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER forum_categories_set_updated_at
    BEFORE UPDATE ON forum_categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER article_categories_set_updated_at
    BEFORE UPDATE ON article_categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER stones_set_updated_at
    BEFORE UPDATE ON stones
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER block_lots_set_updated_at
    BEFORE UPDATE ON block_lots
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER block_items_set_updated_at
    BEFORE UPDATE ON block_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER product_items_set_updated_at
    BEFORE UPDATE ON product_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER forum_posts_set_updated_at
    BEFORE UPDATE ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER forum_comments_set_updated_at
    BEFORE UPDATE ON forum_comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER articles_set_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER article_comments_set_updated_at
    BEFORE UPDATE ON article_comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER industry_news_set_updated_at
    BEFORE UPDATE ON industry_news
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER promotions_set_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER contact_inquiries_set_updated_at
    BEFORE UPDATE ON contact_inquiries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE stones IS 'Stone variety (catalog material), not warehouse stock.';
COMMENT ON COLUMN stones.slug IS 'Public URL segment for /catalog/{slug}.';
COMMENT ON TABLE block_items IS 'Physical block; sale is status, not row delete.';
COMMENT ON TABLE product_items IS 'Unique slab/blank/tile/paving unit; no ERP qty in v1.';
COMMENT ON TABLE media IS 'Object-storage metadata; binaries are not stored in PostgreSQL.';
COMMENT ON TABLE media_links IS 'Polymorphic gallery; at most one is_primary per owner.';
COMMENT ON COLUMN users.role IS 'Privilege ladder: user < professional < moderator < editor < admin.';
COMMENT ON COLUMN products.amount IS 'NULL when price_type = on_request.';

-- ---------------------------------------------------------------------------
-- Vocabulary seeds (not mock catalog / users)
-- ---------------------------------------------------------------------------

INSERT INTO stone_types (code, label, sort_order) VALUES
    ('marble', 'Мрамор', 1),
    ('granite', 'Гранит', 2),
    ('quartzite', 'Кварцит', 3),
    ('onyx', 'Оникс', 4),
    ('travertine', 'Травертин', 5),
    ('limestone', 'Известняк', 6),
    ('sandstone', 'Песчаник', 7);

INSERT INTO finishes (code, label, sort_order) VALUES
    ('polished', 'Полированная', 1),
    ('honed', 'Шлифованная', 2),
    ('satin', 'Сатинированная', 3),
    ('flamed', 'Термообработанная', 4),
    ('sawn', 'Пиленая', 5),
    ('split', 'Колотая', 6),
    ('bush_hammered', 'Бучарда', 7),
    ('leathered', 'Лощёная', 8);

INSERT INTO applications (code, label, sort_order) VALUES
    ('countertop', 'Столешница', 1),
    ('windowsill', 'Подоконник', 2),
    ('stairs', 'Лестницы', 3),
    ('flooring', 'Полы', 4),
    ('cladding', 'Облицовка', 5),
    ('facade', 'Фасад', 6),
    ('paving', 'Мощение', 7),
    ('monument', 'Мемориал', 8);

INSERT INTO forum_categories (code, label, sort_order) VALUES
    ('technology', 'Технологии', 1),
    ('tips', 'Советы', 2),
    ('design', 'Дизайн', 3),
    ('safety', 'Безопасность', 4),
    ('equipment', 'Оборудование', 5),
    ('market', 'Рынок', 6);

INSERT INTO article_categories (code, label, sort_order) VALUES
    ('materials', 'Материалы', 1),
    ('industry', 'Индустрия', 2),
    ('technology', 'Технологии', 3);

COMMIT;
