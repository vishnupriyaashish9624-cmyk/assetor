--
-- PostgreSQL database dump
--

\restrict zYJCfSLthqbBGeQ3fckznPiMPCtbBOPZ9DfyjlFovu3hVqyRuMSYgBCssjtdoQm

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: ressoxis_db
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO ressoxis_db;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: ressoxis_db
--

COMMENT ON SCHEMA public IS '';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: ressoxis_db
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO ressoxis_db;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: area; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.area (
    id integer NOT NULL,
    name character varying(100)
);


ALTER TABLE public.area OWNER TO ressoxis_db;

--
-- Name: area_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.area_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.area_id_seq OWNER TO ressoxis_db;

--
-- Name: area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.area_id_seq OWNED BY public.area.id;


--
-- Name: asset_assignments; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.asset_assignments (
    id integer NOT NULL,
    company_id integer NOT NULL,
    asset_id integer NOT NULL,
    employee_id integer NOT NULL,
    assigned_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    returned_date timestamp without time zone,
    notes text
);


ALTER TABLE public.asset_assignments OWNER TO ressoxis_db;

--
-- Name: asset_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.asset_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_assignments_id_seq OWNER TO ressoxis_db;

--
-- Name: asset_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.asset_assignments_id_seq OWNED BY public.asset_assignments.id;


--
-- Name: asset_categories; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.asset_categories (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text
);


ALTER TABLE public.asset_categories OWNER TO ressoxis_db;

--
-- Name: asset_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.asset_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_categories_id_seq OWNER TO ressoxis_db;

--
-- Name: asset_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.asset_categories_id_seq OWNED BY public.asset_categories.id;


--
-- Name: asset_requests; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.asset_requests (
    id integer NOT NULL,
    company_id integer NOT NULL,
    employee_id integer NOT NULL,
    category_id integer,
    asset_id integer,
    reason text,
    status text DEFAULT 'SUBMITTED'::text,
    admin_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.asset_requests OWNER TO ressoxis_db;

--
-- Name: asset_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.asset_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_requests_id_seq OWNER TO ressoxis_db;

--
-- Name: asset_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.asset_requests_id_seq OWNED BY public.asset_requests.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    company_id integer NOT NULL,
    category_id integer,
    asset_code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    brand character varying(100),
    model character varying(100),
    serial_number character varying(100),
    purchase_date date,
    purchase_cost numeric,
    status text DEFAULT 'AVAILABLE'::text,
    current_holder_id integer,
    location character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.assets OWNER TO ressoxis_db;

--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_id_seq OWNER TO ressoxis_db;

--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    company_id integer,
    user_id integer,
    action character varying(255) NOT NULL,
    entity_type character varying(100),
    entity_id integer,
    details text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO ressoxis_db;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO ressoxis_db;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    max_companies integer DEFAULT 5,
    max_employees integer DEFAULT 100,
    max_assets integer DEFAULT 500,
    enabled_modules jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_code character varying(50),
    trade_license character varying(100),
    tax_no character varying(100),
    industry character varying(100),
    logo character varying(255),
    tenancy_type character varying(20) DEFAULT 'OWNED'::character varying,
    landlord_name character varying(255),
    contract_start_date date,
    contract_end_date date,
    registration_no character varying(100),
    ownership_doc_ref character varying(100),
    country character varying(100),
    state character varying(100),
    city character varying(100),
    area character varying(255),
    address text,
    po_box character varying(50),
    makani_number character varying(100),
    latitude numeric(10,8),
    longitude numeric(11,8),
    telephone character varying(50),
    email character varying(255),
    website character varying(255),
    support_email character varying(255)
);


ALTER TABLE public.clients OWNER TO ressoxis_db;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO ressoxis_db;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    subdomain character varying(100),
    status text DEFAULT 'ACTIVE'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    client_id integer,
    can_add_employee boolean DEFAULT true,
    max_employees integer DEFAULT 10,
    max_assets integer DEFAULT 20,
    company_code character varying(50),
    trade_license character varying(100),
    tax_no character varying(100),
    industry character varying(100),
    logo text,
    tenancy_type character varying(20) DEFAULT 'OWNED'::character varying,
    landlord_name character varying(255),
    contract_start_date date,
    contract_end_date date,
    registration_no character varying(100),
    ownership_doc_ref character varying(100),
    country character varying(100),
    state character varying(100),
    city character varying(100),
    area character varying(100),
    address text,
    po_box character varying(50),
    makani_number character varying(100),
    telephone character varying(50),
    email character varying(255),
    website character varying(255)
);


ALTER TABLE public.companies OWNER TO ressoxis_db;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO ressoxis_db;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: company_documents; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.company_documents (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    file_type character varying(100),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_documents OWNER TO ressoxis_db;

--
-- Name: company_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.company_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_documents_id_seq OWNER TO ressoxis_db;

--
-- Name: company_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.company_documents_id_seq OWNED BY public.company_documents.id;


--
-- Name: company_module_field_selection; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.company_module_field_selection (
    id integer NOT NULL,
    company_module_id integer NOT NULL,
    field_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.company_module_field_selection OWNER TO ressoxis_db;

--
-- Name: company_module_field_selection_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.company_module_field_selection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_module_field_selection_id_seq OWNER TO ressoxis_db;

--
-- Name: company_module_field_selection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.company_module_field_selection_id_seq OWNED BY public.company_module_field_selection.id;


--
-- Name: company_modules; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.company_modules (
    id integer NOT NULL,
    company_id integer NOT NULL,
    module_id integer NOT NULL,
    is_enabled integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    country_id integer,
    property_type_id integer,
    premises_type_id integer,
    area_id integer,
    status_id integer DEFAULT 1
);


ALTER TABLE public.company_modules OWNER TO ressoxis_db;

--
-- Name: company_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.company_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_modules_id_seq OWNER TO ressoxis_db;

--
-- Name: company_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.company_modules_id_seq OWNED BY public.company_modules.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    country_name character varying(100) NOT NULL
);


ALTER TABLE public.countries OWNER TO ressoxis_db;

--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.countries_id_seq OWNER TO ressoxis_db;

--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50)
);


ALTER TABLE public.departments OWNER TO ressoxis_db;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO ressoxis_db;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    company_id integer NOT NULL,
    department_id integer,
    employee_id_card character varying(50),
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    "position" character varying(100)
);


ALTER TABLE public.employees OWNER TO ressoxis_db;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO ressoxis_db;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: maintenance_tickets; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.maintenance_tickets (
    id integer NOT NULL,
    company_id integer NOT NULL,
    asset_id integer NOT NULL,
    issue_description text NOT NULL,
    status text DEFAULT 'OPEN'::text,
    priority text DEFAULT 'MEDIUM'::text,
    cost numeric DEFAULT 0.00,
    scheduled_date date,
    completion_date date,
    performed_by character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.maintenance_tickets OWNER TO ressoxis_db;

--
-- Name: maintenance_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.maintenance_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_tickets_id_seq OWNER TO ressoxis_db;

--
-- Name: maintenance_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.maintenance_tickets_id_seq OWNED BY public.maintenance_tickets.id;


--
-- Name: module_heads; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.module_heads (
    id integer NOT NULL,
    template_id integer NOT NULL,
    head_title character varying(255) NOT NULL,
    head_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.module_heads OWNER TO ressoxis_db;

--
-- Name: module_heads_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.module_heads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_heads_id_seq OWNER TO ressoxis_db;

--
-- Name: module_heads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.module_heads_id_seq OWNED BY public.module_heads.id;


--
-- Name: module_master; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.module_master (
    module_id integer NOT NULL,
    module_name character varying(255) NOT NULL,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.module_master OWNER TO ressoxis_db;

--
-- Name: module_master_module_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.module_master_module_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_master_module_id_seq OWNER TO ressoxis_db;

--
-- Name: module_master_module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.module_master_module_id_seq OWNED BY public.module_master.module_id;


--
-- Name: module_section_field_options; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.module_section_field_options (
    id integer NOT NULL,
    field_id integer NOT NULL,
    option_label character varying(255) NOT NULL,
    option_value character varying(255) NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.module_section_field_options OWNER TO ressoxis_db;

--
-- Name: module_section_field_options_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.module_section_field_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_section_field_options_id_seq OWNER TO ressoxis_db;

--
-- Name: module_section_field_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.module_section_field_options_id_seq OWNED BY public.module_section_field_options.id;


--
-- Name: module_section_fields; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.module_section_fields (
    id integer NOT NULL,
    company_id integer NOT NULL,
    module_id integer NOT NULL,
    section_id integer NOT NULL,
    field_key character varying(100) NOT NULL,
    label character varying(255) NOT NULL,
    field_type character varying(50) NOT NULL,
    placeholder character varying(255),
    is_required integer DEFAULT 0,
    is_active integer DEFAULT 1,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.module_section_fields OWNER TO ressoxis_db;

--
-- Name: module_section_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.module_section_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_section_fields_id_seq OWNER TO ressoxis_db;

--
-- Name: module_section_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.module_section_fields_id_seq OWNED BY public.module_section_fields.id;


--
-- Name: module_sections; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.module_sections (
    id integer NOT NULL,
    company_id integer NOT NULL,
    module_id integer NOT NULL,
    name character varying(255) NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.module_sections OWNER TO ressoxis_db;

--
-- Name: module_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.module_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_sections_id_seq OWNER TO ressoxis_db;

--
-- Name: module_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.module_sections_id_seq OWNED BY public.module_sections.id;


--
-- Name: module_subhead_options; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.module_subhead_options (
    id integer NOT NULL,
    subhead_id integer NOT NULL,
    option_label character varying(255) NOT NULL,
    option_value character varying(255) NOT NULL,
    option_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.module_subhead_options OWNER TO ressoxis_db;

--
-- Name: module_subhead_options_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.module_subhead_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_subhead_options_id_seq OWNER TO ressoxis_db;

--
-- Name: module_subhead_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.module_subhead_options_id_seq OWNED BY public.module_subhead_options.id;


--
-- Name: module_subheads; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.module_subheads (
    id integer NOT NULL,
    head_id integer NOT NULL,
    subhead_title character varying(255) NOT NULL,
    field_type date NOT NULL,
    placeholder character varying(255),
    is_required integer DEFAULT 0,
    subhead_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.module_subheads OWNER TO ressoxis_db;

--
-- Name: module_subheads_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.module_subheads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_subheads_id_seq OWNER TO ressoxis_db;

--
-- Name: module_subheads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.module_subheads_id_seq OWNED BY public.module_subheads.id;


--
-- Name: module_templates; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.module_templates (
    id integer NOT NULL,
    company_id integer NOT NULL,
    module_id integer NOT NULL,
    template_name character varying(255),
    description text,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.module_templates OWNER TO ressoxis_db;

--
-- Name: module_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.module_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_templates_id_seq OWNER TO ressoxis_db;

--
-- Name: module_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.module_templates_id_seq OWNED BY public.module_templates.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    company_id integer NOT NULL,
    module_key character varying(50),
    name character varying(255) NOT NULL,
    description text,
    status text DEFAULT 'ACTIVE'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.modules OWNER TO ressoxis_db;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO ressoxis_db;

--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: modules_master; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.modules_master (
    id integer NOT NULL,
    module_key character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(100)
);


ALTER TABLE public.modules_master OWNER TO ressoxis_db;

--
-- Name: modules_master_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.modules_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_master_id_seq OWNER TO ressoxis_db;

--
-- Name: modules_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.modules_master_id_seq OWNED BY public.modules_master.id;


--
-- Name: office_owned_details; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.office_owned_details (
    premise_id integer NOT NULL,
    buy_date date NOT NULL,
    purchase_value numeric NOT NULL,
    property_size_sqft numeric,
    title_deed_ref character varying(100),
    owner_name character varying(120),
    renewal_required integer DEFAULT 0,
    renewal_date date,
    insurance_required integer DEFAULT 0,
    insurance_expiry date,
    notes text,
    floors_count integer DEFAULT 0,
    depreciation_rate numeric DEFAULT 0.00,
    electricity_available integer DEFAULT 0,
    water_available integer DEFAULT 0,
    internet_available integer DEFAULT 0,
    ownership_type character varying(50),
    vendor_name character varying(150),
    warranty_end_date date,
    property_tax_id character varying(80),
    depreciation_percent numeric
);


ALTER TABLE public.office_owned_details OWNER TO ressoxis_db;

--
-- Name: office_premise_attachments; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.office_premise_attachments (
    attachment_id integer NOT NULL,
    premise_id integer NOT NULL,
    company_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    mime_type character varying(100),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.office_premise_attachments OWNER TO ressoxis_db;

--
-- Name: office_premise_attachments_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.office_premise_attachments_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.office_premise_attachments_attachment_id_seq OWNER TO ressoxis_db;

--
-- Name: office_premise_attachments_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.office_premise_attachments_attachment_id_seq OWNED BY public.office_premise_attachments.attachment_id;


--
-- Name: office_premises; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.office_premises (
    premise_id integer NOT NULL,
    company_id integer NOT NULL,
    premise_type text NOT NULL,
    premises_name character varying(255) NOT NULL,
    building_name character varying(255) NOT NULL,
    premises_use text NOT NULL,
    country character varying(100) NOT NULL,
    area_id integer,
    company_module_id integer,
    city character varying(100) NOT NULL,
    full_address text NOT NULL,
    location_notes text,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    document_name character varying(255),
    document_path character varying(255),
    document_mime character varying(50),
    google_map_url text,
    capacity integer DEFAULT 0,
    address_line2 character varying(255),
    landmark character varying(255),
    address_line1 character varying(255),
    location_lat numeric,
    location_lng numeric,
    area_sqft numeric,
    floors integer,
    parking_available integer DEFAULT 0,
    parking_area character varying(255)
);


ALTER TABLE public.office_premises OWNER TO ressoxis_db;

--
-- Name: office_premises_documents; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.office_premises_documents (
    doc_id integer NOT NULL,
    company_id integer NOT NULL,
    premise_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    mime_type character varying(80) NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.office_premises_documents OWNER TO ressoxis_db;

--
-- Name: office_premises_documents_doc_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.office_premises_documents_doc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.office_premises_documents_doc_id_seq OWNER TO ressoxis_db;

--
-- Name: office_premises_documents_doc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.office_premises_documents_doc_id_seq OWNED BY public.office_premises_documents.doc_id;


--
-- Name: office_premises_premise_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.office_premises_premise_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.office_premises_premise_id_seq OWNER TO ressoxis_db;

--
-- Name: office_premises_premise_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.office_premises_premise_id_seq OWNED BY public.office_premises.premise_id;


--
-- Name: office_premises_utilities; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.office_premises_utilities (
    premise_id integer NOT NULL,
    company_id integer NOT NULL,
    electricity_no character varying(80),
    water_no character varying(80),
    internet_provider character varying(120),
    utility_notes text
);


ALTER TABLE public.office_premises_utilities OWNER TO ressoxis_db;

--
-- Name: office_rental_details; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.office_rental_details (
    premise_id integer NOT NULL,
    landlord_name character varying(255) NOT NULL,
    landlord_contact_person character varying(120),
    landlord_phone character varying(50) NOT NULL,
    landlord_email character varying(120),
    contract_start date NOT NULL,
    contract_end date NOT NULL,
    monthly_rent numeric NOT NULL,
    security_deposit numeric,
    renewal_reminder_date date,
    payment_frequency text DEFAULT 'MONTHLY'::text,
    next_payment_date date,
    late_fee_terms character varying(255),
    notes text,
    yearly_rent numeric,
    deposit_amount numeric,
    next_due_date date,
    lease_start_date date,
    lease_end_date date,
    rent_amount numeric,
    payment_cycle character varying(50) DEFAULT 'MONTHLY'::character varying
);


ALTER TABLE public.office_rental_details OWNER TO ressoxis_db;

--
-- Name: premises_module_details; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.premises_module_details (
    id integer NOT NULL,
    premise_id integer NOT NULL,
    company_id integer NOT NULL,
    field_key character varying(255) NOT NULL,
    field_value text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.premises_module_details OWNER TO ressoxis_db;

--
-- Name: premises_module_details_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.premises_module_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.premises_module_details_id_seq OWNER TO ressoxis_db;

--
-- Name: premises_module_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.premises_module_details_id_seq OWNED BY public.premises_module_details.id;


--
-- Name: premises_types; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.premises_types (
    id integer NOT NULL,
    type_name character varying(50) NOT NULL
);


ALTER TABLE public.premises_types OWNER TO ressoxis_db;

--
-- Name: premises_types_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.premises_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.premises_types_id_seq OWNER TO ressoxis_db;

--
-- Name: premises_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.premises_types_id_seq OWNED BY public.premises_types.id;


--
-- Name: property_types; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.property_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.property_types OWNER TO ressoxis_db;

--
-- Name: property_types_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.property_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.property_types_id_seq OWNER TO ressoxis_db;

--
-- Name: property_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.property_types_id_seq OWNED BY public.property_types.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: ressoxis_db
--

CREATE TABLE public.users (
    id integer NOT NULL,
    company_id integer,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'ACTIVE'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    client_id integer
);


ALTER TABLE public.users OWNER TO ressoxis_db;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: ressoxis_db
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO ressoxis_db;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ressoxis_db
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: area id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.area ALTER COLUMN id SET DEFAULT nextval('public.area_id_seq'::regclass);


--
-- Name: asset_assignments id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_assignments ALTER COLUMN id SET DEFAULT nextval('public.asset_assignments_id_seq'::regclass);


--
-- Name: asset_categories id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_categories ALTER COLUMN id SET DEFAULT nextval('public.asset_categories_id_seq'::regclass);


--
-- Name: asset_requests id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_requests ALTER COLUMN id SET DEFAULT nextval('public.asset_requests_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: company_documents id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_documents ALTER COLUMN id SET DEFAULT nextval('public.company_documents_id_seq'::regclass);


--
-- Name: company_module_field_selection id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_module_field_selection ALTER COLUMN id SET DEFAULT nextval('public.company_module_field_selection_id_seq'::regclass);


--
-- Name: company_modules id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_modules ALTER COLUMN id SET DEFAULT nextval('public.company_modules_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: maintenance_tickets id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.maintenance_tickets ALTER COLUMN id SET DEFAULT nextval('public.maintenance_tickets_id_seq'::regclass);


--
-- Name: module_heads id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_heads ALTER COLUMN id SET DEFAULT nextval('public.module_heads_id_seq'::regclass);


--
-- Name: module_master module_id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_master ALTER COLUMN module_id SET DEFAULT nextval('public.module_master_module_id_seq'::regclass);


--
-- Name: module_section_field_options id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_section_field_options ALTER COLUMN id SET DEFAULT nextval('public.module_section_field_options_id_seq'::regclass);


--
-- Name: module_section_fields id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_section_fields ALTER COLUMN id SET DEFAULT nextval('public.module_section_fields_id_seq'::regclass);


--
-- Name: module_sections id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_sections ALTER COLUMN id SET DEFAULT nextval('public.module_sections_id_seq'::regclass);


--
-- Name: module_subhead_options id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_subhead_options ALTER COLUMN id SET DEFAULT nextval('public.module_subhead_options_id_seq'::regclass);


--
-- Name: module_subheads id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_subheads ALTER COLUMN id SET DEFAULT nextval('public.module_subheads_id_seq'::regclass);


--
-- Name: module_templates id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_templates ALTER COLUMN id SET DEFAULT nextval('public.module_templates_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: modules_master id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.modules_master ALTER COLUMN id SET DEFAULT nextval('public.modules_master_id_seq'::regclass);


--
-- Name: office_premise_attachments attachment_id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premise_attachments ALTER COLUMN attachment_id SET DEFAULT nextval('public.office_premise_attachments_attachment_id_seq'::regclass);


--
-- Name: office_premises premise_id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premises ALTER COLUMN premise_id SET DEFAULT nextval('public.office_premises_premise_id_seq'::regclass);


--
-- Name: office_premises_documents doc_id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premises_documents ALTER COLUMN doc_id SET DEFAULT nextval('public.office_premises_documents_doc_id_seq'::regclass);


--
-- Name: premises_module_details id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.premises_module_details ALTER COLUMN id SET DEFAULT nextval('public.premises_module_details_id_seq'::regclass);


--
-- Name: premises_types id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.premises_types ALTER COLUMN id SET DEFAULT nextval('public.premises_types_id_seq'::regclass);


--
-- Name: property_types id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.property_types ALTER COLUMN id SET DEFAULT nextval('public.property_types_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: area area_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_pkey PRIMARY KEY (id);


--
-- Name: asset_assignments asset_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_pkey PRIMARY KEY (id);


--
-- Name: asset_categories asset_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_pkey PRIMARY KEY (id);


--
-- Name: asset_requests asset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT asset_requests_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_documents company_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_documents
    ADD CONSTRAINT company_documents_pkey PRIMARY KEY (id);


--
-- Name: company_module_field_selection company_module_field_selection_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_module_field_selection
    ADD CONSTRAINT company_module_field_selection_pkey PRIMARY KEY (id);


--
-- Name: company_modules company_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_modules
    ADD CONSTRAINT company_modules_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: maintenance_tickets maintenance_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_pkey PRIMARY KEY (id);


--
-- Name: module_heads module_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_heads
    ADD CONSTRAINT module_heads_pkey PRIMARY KEY (id);


--
-- Name: module_master module_master_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_master
    ADD CONSTRAINT module_master_pkey PRIMARY KEY (module_id);


--
-- Name: module_section_field_options module_section_field_options_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_section_field_options
    ADD CONSTRAINT module_section_field_options_pkey PRIMARY KEY (id);


--
-- Name: module_section_fields module_section_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_section_fields
    ADD CONSTRAINT module_section_fields_pkey PRIMARY KEY (id);


--
-- Name: module_sections module_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_sections
    ADD CONSTRAINT module_sections_pkey PRIMARY KEY (id);


--
-- Name: module_subhead_options module_subhead_options_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_subhead_options
    ADD CONSTRAINT module_subhead_options_pkey PRIMARY KEY (id);


--
-- Name: module_subheads module_subheads_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_subheads
    ADD CONSTRAINT module_subheads_pkey PRIMARY KEY (id);


--
-- Name: module_templates module_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_templates
    ADD CONSTRAINT module_templates_pkey PRIMARY KEY (id);


--
-- Name: modules_master modules_master_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.modules_master
    ADD CONSTRAINT modules_master_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: office_owned_details office_owned_details_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_owned_details
    ADD CONSTRAINT office_owned_details_pkey PRIMARY KEY (premise_id);


--
-- Name: office_premise_attachments office_premise_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premise_attachments
    ADD CONSTRAINT office_premise_attachments_pkey PRIMARY KEY (attachment_id);


--
-- Name: office_premises_documents office_premises_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premises_documents
    ADD CONSTRAINT office_premises_documents_pkey PRIMARY KEY (doc_id);


--
-- Name: office_premises office_premises_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premises
    ADD CONSTRAINT office_premises_pkey PRIMARY KEY (premise_id);


--
-- Name: office_premises_utilities office_premises_utilities_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premises_utilities
    ADD CONSTRAINT office_premises_utilities_pkey PRIMARY KEY (premise_id);


--
-- Name: office_rental_details office_rental_details_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_rental_details
    ADD CONSTRAINT office_rental_details_pkey PRIMARY KEY (premise_id);


--
-- Name: premises_module_details premises_module_details_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.premises_module_details
    ADD CONSTRAINT premises_module_details_pkey PRIMARY KEY (id);


--
-- Name: premises_types premises_types_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.premises_types
    ADD CONSTRAINT premises_types_pkey PRIMARY KEY (id);


--
-- Name: property_types property_types_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.property_types
    ADD CONSTRAINT property_types_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: asset_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX asset_id ON public.asset_assignments USING btree (asset_id);


--
-- Name: category_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX category_id ON public.assets USING btree (category_id);


--
-- Name: company_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE UNIQUE INDEX company_id ON public.assets USING btree (company_id, asset_code);


--
-- Name: company_id_2; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX company_id_2 ON public.assets USING btree (company_id);


--
-- Name: current_holder_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX current_holder_id ON public.assets USING btree (current_holder_id);


--
-- Name: department_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX department_id ON public.employees USING btree (department_id);


--
-- Name: employee_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX employee_id ON public.asset_assignments USING btree (employee_id);


--
-- Name: field_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX field_id ON public.module_section_field_options USING btree (field_id);


--
-- Name: fk_cm_property_type; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX fk_cm_property_type ON public.company_modules USING btree (property_type_id);


--
-- Name: head_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX head_id ON public.module_subheads USING btree (head_id);


--
-- Name: idx_area_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX idx_area_id ON public.company_modules USING btree (area_id);


--
-- Name: idx_cm; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX idx_cm ON public.company_module_field_selection USING btree (company_module_id);


--
-- Name: idx_company_module_search; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX idx_company_module_search ON public.company_modules USING btree (company_id, module_id);


--
-- Name: idx_country_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX idx_country_id ON public.company_modules USING btree (country_id);


--
-- Name: idx_field; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX idx_field ON public.company_module_field_selection USING btree (field_id);


--
-- Name: idx_premises_type_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX idx_premises_type_id ON public.company_modules USING btree (premises_type_id);


--
-- Name: idx_status_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX idx_status_id ON public.company_modules USING btree (status_id);


--
-- Name: module_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX module_id ON public.company_modules USING btree (module_id);


--
-- Name: module_key; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE UNIQUE INDEX module_key ON public.modules_master USING btree (module_key);


--
-- Name: name; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE UNIQUE INDEX name ON public.property_types USING btree (name);


--
-- Name: premise_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX premise_id ON public.office_premise_attachments USING btree (premise_id);


--
-- Name: section_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX section_id ON public.module_section_fields USING btree (section_id);


--
-- Name: subdomain; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE UNIQUE INDEX subdomain ON public.companies USING btree (subdomain);


--
-- Name: subhead_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX subhead_id ON public.module_subhead_options USING btree (subhead_id);


--
-- Name: template_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX template_id ON public.module_heads USING btree (template_id);


--
-- Name: unique_field_key; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE UNIQUE INDEX unique_field_key ON public.module_section_fields USING btree (company_id, section_id, field_key);


--
-- Name: uq_country_name; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE UNIQUE INDEX uq_country_name ON public.countries USING btree (country_name);


--
-- Name: user_id; Type: INDEX; Schema: public; Owner: ressoxis_db
--

CREATE INDEX user_id ON public.audit_logs USING btree (user_id);


--
-- Name: clients update_clients_modtime; Type: TRIGGER; Schema: public; Owner: ressoxis_db
--

CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: asset_assignments asset_assignments_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: asset_assignments asset_assignments_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_ibfk_2 FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: asset_assignments asset_assignments_ibfk_3; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_ibfk_3 FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: asset_categories asset_categories_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: asset_requests asset_requests_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT asset_requests_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: asset_requests asset_requests_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT asset_requests_ibfk_2 FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: assets assets_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: assets assets_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_ibfk_2 FOREIGN KEY (category_id) REFERENCES public.asset_categories(id) ON DELETE CASCADE;


--
-- Name: assets assets_ibfk_3; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_ibfk_3 FOREIGN KEY (current_holder_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_ibfk_2 FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: company_modules company_modules_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_modules
    ADD CONSTRAINT company_modules_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_modules company_modules_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_modules
    ADD CONSTRAINT company_modules_ibfk_2 FOREIGN KEY (module_id) REFERENCES public.modules_master(id) ON DELETE CASCADE;


--
-- Name: departments departments_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: employees employees_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: employees employees_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_ibfk_2 FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: company_modules fk_cm_property_type; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_modules
    ADD CONSTRAINT fk_cm_property_type FOREIGN KEY (property_type_id) REFERENCES public.property_types(id) ON DELETE CASCADE;


--
-- Name: company_module_field_selection fk_cm_sel; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.company_module_field_selection
    ADD CONSTRAINT fk_cm_sel FOREIGN KEY (company_module_id) REFERENCES public.company_modules(id) ON DELETE CASCADE;


--
-- Name: companies fk_company_client; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT fk_company_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: maintenance_tickets maintenance_tickets_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: maintenance_tickets maintenance_tickets_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_ibfk_2 FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: module_heads module_heads_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_heads
    ADD CONSTRAINT module_heads_ibfk_1 FOREIGN KEY (template_id) REFERENCES public.module_templates(id) ON DELETE CASCADE;


--
-- Name: module_section_field_options module_section_field_options_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_section_field_options
    ADD CONSTRAINT module_section_field_options_ibfk_1 FOREIGN KEY (field_id) REFERENCES public.module_section_fields(id) ON DELETE CASCADE;


--
-- Name: module_section_fields module_section_fields_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_section_fields
    ADD CONSTRAINT module_section_fields_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: module_section_fields module_section_fields_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_section_fields
    ADD CONSTRAINT module_section_fields_ibfk_2 FOREIGN KEY (module_id) REFERENCES public.module_master(module_id) ON DELETE CASCADE;


--
-- Name: module_section_fields module_section_fields_ibfk_3; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_section_fields
    ADD CONSTRAINT module_section_fields_ibfk_3 FOREIGN KEY (section_id) REFERENCES public.module_sections(id) ON DELETE CASCADE;


--
-- Name: module_sections module_sections_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_sections
    ADD CONSTRAINT module_sections_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: module_sections module_sections_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_sections
    ADD CONSTRAINT module_sections_ibfk_2 FOREIGN KEY (module_id) REFERENCES public.module_master(module_id) ON DELETE CASCADE;


--
-- Name: module_subhead_options module_subhead_options_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_subhead_options
    ADD CONSTRAINT module_subhead_options_ibfk_1 FOREIGN KEY (subhead_id) REFERENCES public.module_subheads(id) ON DELETE CASCADE;


--
-- Name: module_subheads module_subheads_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_subheads
    ADD CONSTRAINT module_subheads_ibfk_1 FOREIGN KEY (head_id) REFERENCES public.module_heads(id) ON DELETE CASCADE;


--
-- Name: module_templates module_templates_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.module_templates
    ADD CONSTRAINT module_templates_ibfk_1 FOREIGN KEY (module_id) REFERENCES public.module_master(module_id) ON DELETE CASCADE;


--
-- Name: modules modules_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: office_owned_details office_owned_details_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_owned_details
    ADD CONSTRAINT office_owned_details_ibfk_1 FOREIGN KEY (premise_id) REFERENCES public.office_premises(premise_id) ON DELETE CASCADE;


--
-- Name: office_premise_attachments office_premise_attachments_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premise_attachments
    ADD CONSTRAINT office_premise_attachments_ibfk_1 FOREIGN KEY (premise_id) REFERENCES public.office_premises(premise_id) ON DELETE CASCADE;


--
-- Name: office_premise_attachments office_premise_attachments_ibfk_2; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premise_attachments
    ADD CONSTRAINT office_premise_attachments_ibfk_2 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: office_premises office_premises_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_premises
    ADD CONSTRAINT office_premises_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: office_rental_details office_rental_details_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.office_rental_details
    ADD CONSTRAINT office_rental_details_ibfk_1 FOREIGN KEY (premise_id) REFERENCES public.office_premises(premise_id) ON DELETE CASCADE;


--
-- Name: users users_ibfk_1; Type: FK CONSTRAINT; Schema: public; Owner: ressoxis_db
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_ibfk_1 FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO ressoxis_db;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO ressoxis_db;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO ressoxis_db;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO ressoxis_db;


--
-- PostgreSQL database dump complete
--

\unrestrict zYJCfSLthqbBGeQ3fckznPiMPCtbBOPZ9DfyjlFovu3hVqyRuMSYgBCssjtdoQm

