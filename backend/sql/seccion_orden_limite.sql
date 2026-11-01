alter table seccion add column if not exists orden integer not null default 0;
alter table seccion add column if not exists limite_mesas integer not null default 20;
alter table seccion add column if not exists numero_inicio integer not null default 1;
