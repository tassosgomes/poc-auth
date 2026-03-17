create table if not exists role_access (
  role text primary key,
  permissions_json jsonb not null,
  screens_json jsonb not null,
  routes_json jsonb not null,
  microfrontends_json jsonb not null,
  version integer not null,
  updated_at timestamptz not null,
  updated_by text not null
);

create table if not exists role_access_audit (
  id bigserial primary key,
  role text not null,
  previous_value_json jsonb,
  new_value_json jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by text not null,
  correlation_id text not null
);

create index if not exists idx_role_access_audit_role_changed_at
  on role_access_audit (role, changed_at desc);