ALTER TABLE public.companies ADD COLUMN enabled_modules jsonb;

--
-- Name: vehicle_module_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_module_details (
    id integer NOT NULL,
    vehicle_id integer NOT NULL,
    company_id integer NOT NULL,
    field_key character varying(255) NOT NULL,
    field_value text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.vehicle_module_details OWNER TO postgres;

--
-- Name: vehicle_module_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicle_module_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.vehicle_module_details_id_seq OWNER TO postgres;

--
-- Name: vehicle_module_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicle_module_details_id_seq OWNED BY public.vehicle_module_details.id;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    vehicle_id integer NOT NULL,
    company_id integer NOT NULL,
    vehicle_name character varying(255) NOT NULL,
    license_plate character varying(50),
    type character varying(50),
    driver character varying(255),
    vehicle_usage character varying(255),
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    country_id integer,
    property_type_id integer,
    premises_type_id integer,
    area_id integer,
    image_path text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicles_vehicle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNER TO postgres;

--
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNED BY public.vehicles.vehicle_id;

--
-- Name: vehicle_module_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_module_details ALTER COLUMN id SET DEFAULT nextval('public.vehicle_module_details_id_seq'::regclass);

--
-- Name: vehicles vehicle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN vehicle_id SET DEFAULT nextval('public.vehicles_vehicle_id_seq'::regclass);

--
-- Name: vehicle_module_details vehicle_module_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_module_details
    ADD CONSTRAINT vehicle_module_details_pkey PRIMARY KEY (id);

--
-- Name: vehicle_module_details vehicle_module_details_vehicle_id_field_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_module_details
    ADD CONSTRAINT vehicle_module_details_vehicle_id_field_key_key UNIQUE (vehicle_id, field_key);

--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);

--
-- Name: vehicle_module_details vehicle_module_details_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_module_details
    ADD CONSTRAINT vehicle_module_details_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE;