BEGIN;

-- =========================================================
-- PickTESO - PostgreSQL production schema
-- Conventions:
--   - snake_case in English
--   - BIGINT GENERATED ALWAYS AS IDENTITY for primary keys
--   - soft delete through active = false where applicable
--   - hard delete allowed mainly for test data and store cascade scenarios
--   - authentication handled externally via Google SSO
-- =========================================================

-- ---------------------------------------------------------
-- Utility function to auto-update updated_at
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE users (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name           VARCHAR(255)  NOT NULL,
    paternal_last_name   VARCHAR(255)  NOT NULL,
    maternal_last_name   VARCHAR(255)  NOT NULL,
    email                VARCHAR(255)  NOT NULL,
    role                 VARCHAR(50)   NOT NULL,
    profile_image        TEXT,
    active               BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('customer', 'store_admin', 'platform_admin'))
);

-- ---------------------------------------------------------
-- stores
-- ---------------------------------------------------------
CREATE TABLE stores (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         VARCHAR(255)  NOT NULL,
    location     VARCHAR(255)  NOT NULL,
    opening_time TIME          NOT NULL,
    closing_time TIME          NOT NULL,
    image        TEXT,
    active       BOOLEAN       NOT NULL DEFAULT TRUE,
    admin_id     BIGINT        NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stores_opening_closing_check CHECK (opening_time < closing_time),
    CONSTRAINT stores_admin_id_fk FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- products
-- ---------------------------------------------------------
CREATE TABLE products (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id      BIGINT         NOT NULL,
    name          VARCHAR(255)   NOT NULL,
    description   TEXT,
    price         NUMERIC(10,2)  NOT NULL,
    product_image TEXT,
    active        BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_price_check CHECK (price >= 0),
    CONSTRAINT products_store_id_fk FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE
);

CREATE INDEX products_store_id_idx     ON products(store_id);
CREATE INDEX products_store_active_idx ON products(store_id, active);

-- ---------------------------------------------------------
-- tags
-- ---------------------------------------------------------
CREATE TABLE tags (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id    BIGINT        NOT NULL,
    name        VARCHAR(255)  NOT NULL,
    description TEXT,
    start_time  TIME          NOT NULL,
    end_time    TIME          NOT NULL,
    icon        TEXT,
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tags_time_range_check    CHECK (start_time < end_time),
    CONSTRAINT tags_store_name_unique   UNIQUE (store_id, name),
    CONSTRAINT tags_store_id_fk FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE
);

CREATE INDEX tags_store_id_idx     ON tags(store_id);
CREATE INDEX tags_store_active_idx ON tags(store_id, active);

-- ---------------------------------------------------------
-- product_tags
-- ---------------------------------------------------------
CREATE TABLE product_tags (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL,
    tag_id     BIGINT NOT NULL,
    CONSTRAINT product_tags_product_id_tag_id_unique UNIQUE (product_id, tag_id),
    CONSTRAINT product_tags_product_id_fk FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,
    CONSTRAINT product_tags_tag_id_fk FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);

CREATE INDEX product_tags_product_id_idx ON product_tags(product_id);
CREATE INDEX product_tags_tag_id_idx     ON product_tags(tag_id);

-- ---------------------------------------------------------
-- carts
-- ---------------------------------------------------------
CREATE TABLE carts (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    store_id   BIGINT       NOT NULL,
    status     VARCHAR(50)  NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT carts_status_check CHECK (status IN ('active', 'checked_out', 'cancelled', 'abandoned')),
    CONSTRAINT carts_user_id_fk FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT carts_store_id_fk FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX carts_one_active_per_user_store_idx
    ON carts(user_id, store_id)
    WHERE status = 'active';

CREATE INDEX carts_user_id_idx  ON carts(user_id);
CREATE INDEX carts_store_id_idx ON carts(store_id);
CREATE INDEX carts_status_idx   ON carts(status);

-- ---------------------------------------------------------
-- cart_products
-- ---------------------------------------------------------
CREATE TABLE cart_products (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id    BIGINT        NOT NULL,
    product_id BIGINT        NOT NULL,
    quantity   INTEGER       NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    CONSTRAINT cart_products_cart_id_product_id_unique UNIQUE (cart_id, product_id),
    CONSTRAINT cart_products_quantity_check   CHECK (quantity > 0),
    CONSTRAINT cart_products_unit_price_check CHECK (unit_price >= 0),
    CONSTRAINT cart_products_cart_id_fk FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE,
    CONSTRAINT cart_products_product_id_fk FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);

CREATE INDEX cart_products_cart_id_idx    ON cart_products(cart_id);
CREATE INDEX cart_products_product_id_idx ON cart_products(product_id);

-- ---------------------------------------------------------
-- orders
-- ---------------------------------------------------------
CREATE TABLE orders (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT        NOT NULL,
    store_id   BIGINT        NOT NULL,
    total      NUMERIC(10,2) NOT NULL,
    status     VARCHAR(50)   NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_total_check  CHECK (total >= 0),
    CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled')),
    CONSTRAINT orders_user_id_fk FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT orders_store_id_fk FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE
);

CREATE INDEX orders_user_id_idx    ON orders(user_id);
CREATE INDEX orders_store_id_idx   ON orders(store_id);
CREATE INDEX orders_status_idx     ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at);

-- ---------------------------------------------------------
-- order_products
-- ---------------------------------------------------------
CREATE TABLE order_products (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id   BIGINT        NOT NULL,
    product_id BIGINT        NOT NULL,
    quantity   INTEGER       NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    CONSTRAINT order_products_order_id_product_id_unique UNIQUE (order_id, product_id),
    CONSTRAINT order_products_quantity_check   CHECK (quantity > 0),
    CONSTRAINT order_products_unit_price_check CHECK (unit_price >= 0),
    CONSTRAINT order_products_order_id_fk FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT order_products_product_id_fk FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);

CREATE INDEX order_products_order_id_idx   ON order_products(order_id);
CREATE INDEX order_products_product_id_idx ON order_products(product_id);

-- ---------------------------------------------------------
-- inventory movements
-- ---------------------------------------------------------
CREATE TABLE inventory (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id    BIGINT       NOT NULL,
    movement_type VARCHAR(50)  NOT NULL,
    quantity      INTEGER      NOT NULL,
    moved_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 'in' and 'out' must be positive; 'adjustment' can be negative, zero, or positive
    CONSTRAINT inventory_movement_type_check CHECK (movement_type IN ('in', 'out', 'adjustment')),
    CONSTRAINT inventory_quantity_check CHECK (
        (movement_type IN ('in', 'out') AND quantity > 0)
        OR
        (movement_type = 'adjustment')
    ),
    CONSTRAINT inventory_product_id_fk FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);

CREATE INDEX inventory_product_id_idx       ON inventory(product_id);
CREATE INDEX inventory_product_moved_at_idx ON inventory(product_id, moved_at DESC);

-- ---------------------------------------------------------
-- stripe_customers
-- ---------------------------------------------------------
CREATE TABLE stripe_customers (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT        NOT NULL,
    stripe_customer_id  VARCHAR(255)  NOT NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stripe_customers_user_id_unique            UNIQUE (user_id),
    CONSTRAINT stripe_customers_stripe_customer_id_unique UNIQUE (stripe_customer_id),
    CONSTRAINT stripe_customers_user_id_fk FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- ---------------------------------------------------------
-- payment_intents
-- ---------------------------------------------------------
CREATE TABLE payment_intents (
    id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id                  BIGINT        NOT NULL,
    user_id                   BIGINT        NOT NULL,
    stripe_payment_intent_id  VARCHAR(255)  NOT NULL,
    amount                    NUMERIC(10,2) NOT NULL,
    currency                  VARCHAR(10)   NOT NULL DEFAULT 'MXN',
    status                    VARCHAR(50)   NOT NULL,
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_intents_order_id_unique                  UNIQUE (order_id),
    CONSTRAINT payment_intents_stripe_payment_intent_id_unique  UNIQUE (stripe_payment_intent_id),
    CONSTRAINT payment_intents_amount_check CHECK (amount >= 0),
    CONSTRAINT payment_intents_status_check CHECK (
        status IN (
            'requires_payment_method',
            'requires_confirmation',
            'requires_action',
            'processing',
            'succeeded',
            'canceled'
        )
    ),
    CONSTRAINT payment_intents_order_id_fk FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT payment_intents_user_id_fk FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE INDEX payment_intents_user_id_idx ON payment_intents(user_id);
CREATE INDEX payment_intents_status_idx  ON payment_intents(status);

-- ---------------------------------------------------------
-- payment_events
-- ---------------------------------------------------------
CREATE TABLE payment_events (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_intent_id  BIGINT        NOT NULL,
    stripe_event_id    VARCHAR(255)  NOT NULL,
    event_type         VARCHAR(255)  NOT NULL,
    payload            JSONB         NOT NULL,
    received_at        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_events_stripe_event_id_unique UNIQUE (stripe_event_id),
    CONSTRAINT payment_events_payment_intent_id_fk FOREIGN KEY (payment_intent_id)
        REFERENCES payment_intents(id)
        ON DELETE CASCADE
);

CREATE INDEX payment_events_payment_intent_id_idx ON payment_events(payment_intent_id);
CREATE INDEX payment_events_received_at_idx        ON payment_events(received_at);

-- ---------------------------------------------------------
-- payments
-- ---------------------------------------------------------
CREATE TABLE payments (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id           BIGINT        NOT NULL,
    user_id            BIGINT        NOT NULL,
    payment_intent_id  BIGINT        NOT NULL,
    provider           VARCHAR(50)   NOT NULL DEFAULT 'stripe',
    stripe_charge_id   VARCHAR(255)  NOT NULL,
    amount             NUMERIC(10,2) NOT NULL,
    currency           VARCHAR(10)   NOT NULL DEFAULT 'MXN',
    status             VARCHAR(50)   NOT NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_order_id_unique           UNIQUE (order_id),
    CONSTRAINT payments_payment_intent_id_unique  UNIQUE (payment_intent_id),
    CONSTRAINT payments_stripe_charge_id_unique   UNIQUE (stripe_charge_id),
    CONSTRAINT payments_provider_check CHECK (provider IN ('stripe')),
    CONSTRAINT payments_amount_check   CHECK (amount >= 0),
    CONSTRAINT payments_status_check   CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
    CONSTRAINT payments_order_id_fk FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT payments_user_id_fk FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT payments_payment_intent_id_fk FOREIGN KEY (payment_intent_id)
        REFERENCES payment_intents(id)
        ON DELETE CASCADE
);

CREATE INDEX payments_user_id_idx    ON payments(user_id);
CREATE INDEX payments_status_idx     ON payments(status);
CREATE INDEX payments_created_at_idx ON payments(created_at);

-- ---------------------------------------------------------
-- Triggers for updated_at
-- ---------------------------------------------------------
CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stores_set_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tags_set_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_carts_set_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_set_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventory_set_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stripe_customers_set_updated_at
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payment_intents_set_updated_at
    BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_set_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;