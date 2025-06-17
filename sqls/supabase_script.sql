-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.difficulties (
                                     id uuid NOT NULL DEFAULT gen_random_uuid(),
                                     created_at timestamp with time zone NOT NULL DEFAULT now(),
                                     update_at timestamp with time zone,
                                     use_yn boolean NOT NULL DEFAULT true,
                                     name character varying NOT NULL,
                                     CONSTRAINT difficulties_pkey PRIMARY KEY (id)
);
CREATE TABLE public.equipments (
                                   id uuid NOT NULL DEFAULT gen_random_uuid(),
                                   created_at timestamp with time zone NOT NULL DEFAULT now(),
                                   update_at timestamp with time zone,
                                   use_yn boolean NOT NULL DEFAULT true,
                                   name character varying NOT NULL,
                                   CONSTRAINT equipments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exercise_methods (
                                         id uuid NOT NULL DEFAULT gen_random_uuid(),
                                         name character varying,
                                         use_yn boolean NOT NULL DEFAULT true,
                                         created_at timestamp with time zone NOT NULL DEFAULT now(),
                                         update_at timestamp with time zone,
                                         CONSTRAINT exercise_methods_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exercise_records (
                                         id uuid NOT NULL DEFAULT gen_random_uuid(),
                                         instance_id uuid NOT NULL,
                                         program_exercise_id uuid,
                                         exercise_id uuid NOT NULL,
                                         set_number integer NOT NULL CHECK (set_number > 0),
                                         reps integer CHECK (reps >= 0),
                                         weight numeric CHECK (weight >= 0::numeric),
  is_completed boolean DEFAULT false,
  notes text,
  recorded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exercise_records_pkey PRIMARY KEY (id),
  CONSTRAINT exercise_records_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.user_program_instances(id),
  CONSTRAINT exercise_records_program_exercise_id_fkey FOREIGN KEY (program_exercise_id) REFERENCES public.program_exercises(id),
  CONSTRAINT exercise_records_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.exercises (
                                  id uuid NOT NULL DEFAULT gen_random_uuid(),
                                  muscle_group uuid NOT NULL,
                                  exercise_method uuid NOT NULL,
                                  equipment uuid NOT NULL,
                                  difficulty uuid NOT NULL,
                                  exercise_name text NOT NULL,
                                  primary_muscles jsonb NOT NULL,
                                  secondary_muscles jsonb,
                                  description text,
                                  tips text,
                                  image_url text,
                                  use_yn boolean NOT NULL DEFAULT true,
                                  created_at timestamp with time zone NOT NULL DEFAULT now(),
                                  update_at timestamp with time zone,
                                  CONSTRAINT exercises_pkey PRIMARY KEY (id),
                                  CONSTRAINT exercises_difficulty_fkey FOREIGN KEY (difficulty) REFERENCES public.difficulties(id),
                                  CONSTRAINT exercises_equipment_fkey FOREIGN KEY (equipment) REFERENCES public.equipments(id),
                                  CONSTRAINT exercises_exercise_method_fkey FOREIGN KEY (exercise_method) REFERENCES public.exercise_methods(id),
                                  CONSTRAINT exercises_muscle_group_fkey FOREIGN KEY (muscle_group) REFERENCES public.muscle_groups(id)
);
CREATE TABLE public.muscle_groups (
                                      id uuid NOT NULL DEFAULT gen_random_uuid(),
                                      created_at timestamp with time zone DEFAULT now(),
                                      update_at timestamp with time zone,
                                      use_yn boolean DEFAULT true,
                                      name character varying NOT NULL UNIQUE,
                                      CONSTRAINT muscle_groups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.program_exercises (
                                          id uuid NOT NULL DEFAULT gen_random_uuid(),
                                          program_id uuid NOT NULL,
                                          exercise_id uuid NOT NULL,
                                          order_in_program integer NOT NULL,
                                          default_sets integer NOT NULL CHECK (default_sets > 0),
                                          default_reps jsonb,
                                          default_weight jsonb,
                                          rest_time_seconds integer CHECK (rest_time_seconds >= 0),
                                          notes text,
                                          CONSTRAINT program_exercises_pkey PRIMARY KEY (id),
                                          CONSTRAINT program_exercises_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.user_programs(id),
                                          CONSTRAINT program_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.program_shares (
                                       id uuid NOT NULL DEFAULT gen_random_uuid(),
                                       original_program_id uuid NOT NULL,
                                       copied_program_id uuid NOT NULL UNIQUE,
                                       copied_by_user_id uuid NOT NULL,
                                       copied_at timestamp with time zone DEFAULT now(),
                                       CONSTRAINT program_shares_pkey PRIMARY KEY (id),
                                       CONSTRAINT program_shares_copied_by_user_id_fkey FOREIGN KEY (copied_by_user_id) REFERENCES public.users(id),
                                       CONSTRAINT program_shares_original_program_id_fkey FOREIGN KEY (original_program_id) REFERENCES public.user_programs(id),
                                       CONSTRAINT program_shares_copied_program_id_fkey FOREIGN KEY (copied_program_id) REFERENCES public.user_programs(id)
);
CREATE TABLE public.todos (
                              id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
                              task text,
                              is_complete boolean NOT NULL DEFAULT false,
                              created_at timestamp with time zone DEFAULT now(),
                              CONSTRAINT todos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_program_instances (
                                               id uuid NOT NULL DEFAULT gen_random_uuid(),
                                               program_id uuid,
                                               start_time timestamp with time zone NOT NULL DEFAULT now(),
                                               end_time timestamp with time zone,
                                               total_duration_seconds integer CHECK (total_duration_seconds >= 0),
                                               status character varying NOT NULL DEFAULT 'in_progress'::character varying,
                                               notes text,
                                               user_id uuid,
                                               CONSTRAINT user_program_instances_pkey PRIMARY KEY (id),
                                               CONSTRAINT user_program_instances_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.user_programs(id),
                                               CONSTRAINT user_program_instances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_programs (
                                      id uuid NOT NULL DEFAULT gen_random_uuid(),
                                      title character varying NOT NULL,
                                      description text,
                                      is_public boolean DEFAULT false,
                                      view_count integer DEFAULT 0 CHECK (view_count >= 0),
                                      use_count integer DEFAULT 0 CHECK (use_count >= 0),
                                      created_at timestamp with time zone DEFAULT now(),
                                      updated_at timestamp with time zone DEFAULT now(),
                                      user_id uuid,
                                      CONSTRAINT user_programs_pkey PRIMARY KEY (id),
                                      CONSTRAINT user_programs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
                              id uuid NOT NULL DEFAULT gen_random_uuid(),
                              username character varying NOT NULL,
                              email character varying NOT NULL UNIQUE,
                              created_at timestamp with time zone DEFAULT now(),
                              plan_type character varying NOT NULL DEFAULT 'free'::character varying,
                              role character varying NOT NULL DEFAULT 'user'::character varying,
                              subscription_start_date timestamp with time zone,
                              subscription_end_date timestamp with time zone,
                              is_subscription_active boolean DEFAULT false,
                              updated_at timestamp with time zone,
                              nickname character varying UNIQUE,
                              profile_image_url text,
                              status character varying NOT NULL DEFAULT 'active'::character varying,
                              deactivated_at timestamp with time zone,
                              withdrawal_at timestamp with time zone,
                              last_login_at timestamp with time zone,
                              password_last_changed_at timestamp with time zone DEFAULT now(),
                              password text NOT NULL,
                              CONSTRAINT users_pkey PRIMARY KEY (id)
);