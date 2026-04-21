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