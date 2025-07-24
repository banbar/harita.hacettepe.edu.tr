
-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS postgis   WITH SCHEMA public;

-- 2) Table and schemas 

-- units table
CREATE TABLE public.units (
  id          VARCHAR     NOT NULL,
  geom        geometry(Point,4326),
  name        VARCHAR(254),
  description VARCHAR(254),
  website     VARCHAR(255),
  telefon     VARCHAR(50),
  user_id     INTEGER
);
CREATE SEQUENCE public.birimler_id_seq
  START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.birimler_id_seq
  OWNED BY public.units.id;
ALTER TABLE public.units
  ALTER COLUMN id SET DEFAULT nextval('public.birimler_id_seq'::regclass);

-- events table
CREATE TABLE public.events (
  id         INTEGER     NOT NULL,
  title      VARCHAR(255) NOT NULL,
  date       DATE        NOT NULL,
  "time"     TIME,
  location   VARCHAR(255),
  event_type VARCHAR(100),
  geom       geometry(Point,4326),
  user_id    INTEGER,
  website    VARCHAR(255),
  image_path VARCHAR,
  active     BOOLEAN DEFAULT true NOT NULL
);
CREATE SEQUENCE public.etkinlikler_etkinlik_id_seq
  AS INTEGER START WITH 1 INCREMENT BY 1 NO MINVALUE CACHE 1;
ALTER SEQUENCE public.etkinlikler_etkinlik_id_seq
  OWNED BY public.events.id;
ALTER TABLE public.events
  ALTER COLUMN id SET DEFAULT nextval('public.etkinlikler_etkinlik_id_seq'::regclass);

-- update table
CREATE TABLE public.update (
  id           INTEGER     NOT NULL,
  update_type  VARCHAR(100) NOT NULL,
  description  TEXT,
  geom         geometry(Point,4326),
  user_id      INTEGER,
  record_time  TIMESTAMPTZ DEFAULT now() NOT NULL,
  active       BOOLEAN DEFAULT true NOT NULL
);
CREATE SEQUENCE public.hata_noktalar_id_seq
  AS INTEGER START WITH 1 INCREMENT BY 1 NO MINVALUE CACHE 1;
ALTER SEQUENCE public.hata_noktalar_id_seq
  OWNED BY public.update.id;
ALTER TABLE public.update
  ALTER COLUMN id SET DEFAULT nextval('public.hata_noktalar_id_seq'::regclass);

-- users table
CREATE TABLE public.users (
  id                      INTEGER     NOT NULL,
  username                VARCHAR(255) NOT NULL,
  password                VARCHAR(255) NOT NULL,
  role                    VARCHAR(50)  DEFAULT 'normal',
  name                    VARCHAR(100),
  surname                 VARCHAR(100),
  email                   VARCHAR(255),
  is_verified             BOOLEAN DEFAULT false,
  activation_code         VARCHAR(64),
  community               VARCHAR,
  student_no              VARCHAR(20),
  email_verified          BOOLEAN DEFAULT false NOT NULL,
  two_factor_enabled      BOOLEAN DEFAULT false NOT NULL,
  two_factor_secret       TEXT,
  unit_id                 VARCHAR(255),
  registration_date       TIMESTAMPTZ DEFAULT now() NOT NULL,
  password_reset_required BOOLEAN DEFAULT false NOT NULL,
  reset_code_expires      TIMESTAMP
);
CREATE SEQUENCE public.users_id_seq
  AS INTEGER START WITH 1 INCREMENT BY 1 NO MINVALUE CACHE 1;
ALTER SEQUENCE public.users_id_seq
  OWNED BY public.users.id;
ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- 3) Primary keys (PKs) and Foreign Keys (FKs)
ALTER TABLE public.units  ADD CONSTRAINT birimler_pkey PRIMARY KEY (id);
ALTER TABLE public.events ADD CONSTRAINT etkinlikler_pkey PRIMARY KEY (id);
ALTER TABLE public.update ADD CONSTRAINT hata_noktalar_pkey PRIMARY KEY (id);
ALTER TABLE public.users  ADD CONSTRAINT users_pkey     PRIMARY KEY (id);

ALTER TABLE public.users
  ADD CONSTRAINT users_username_key UNIQUE (username),
  ADD CONSTRAINT users_email_key    UNIQUE (email);

-- 4) Foreign Keys
ALTER TABLE public.units
  ADD CONSTRAINT fk_birimler_user FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.events
  ADD CONSTRAINT fk_etkinlik_user FOREIGN KEY (user_id) REFERENCES public.users(id)
    ON DELETE CASCADE;

ALTER TABLE public.update
  ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id)
    ON DELETE CASCADE;

ALTER TABLE public.users
  ADD CONSTRAINT users_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id)
    ON DELETE SET NULL;
