-- ============================================================
-- YPOTI Compras — Phase 3: User Migration
-- Version: 003
-- Date: 2026-02-28
-- Creates auth.users + public.profiles for all 238 employees
-- Roles corrected: admin=Ana Moller only, diretoria=Mauricio+Ronei
-- ============================================================

-- NOTE: This SQL uses Supabase's auth.users table directly.
-- It creates users with the synthetic email username@ypoti.local
-- and password from YPOTI_DEFAULT_PASSWORD env var (bcrypt hashed by Supabase).
-- The profiles table is populated with role, establishment, position.

-- We need to use the Supabase Admin API to create auth users,
-- since INSERT into auth.users requires specific encrypted password format.
-- Instead, we'll INSERT profiles directly and use a separate script
-- for auth user creation.

-- APPROACH: Insert profiles first, then create auth users via API.
-- The profile.auth_id will be updated after auth user creation.

BEGIN;

-- ============================================================
-- Insert all profiles (without auth_id for now)
-- auth_id will be linked after auth.users are created
-- ============================================================
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ronei', 'Ronei Ferreira', 'diretoria', NULL, 'Diretor', 'RF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ana.moller', 'Ana Beatriz Moller', 'admin', NULL, 'Administradora General', 'AM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fran.candia', 'Fran Candia', 'lider', NULL, 'Regente Salud y Seguridad', 'FC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('liz.fleitas', 'Liz Fleitas', 'solicitante', NULL, 'Rrhh y Sso', 'LF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('santiago.campos', 'Santiago Jose Maria Campos Ruiz Diaz', 'solicitante', NULL, 'Asistente Trazabilidad', 'SC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('jazmin.tamay', 'Jazmin Tamay', 'lider', NULL, 'Regente Medicina Laboral', 'JT', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fabiano', 'Fabiano Squeruque', 'gerente', NULL, 'Gerente Lusipar, Santa Clara e Ybypora', 'FS', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('paulo', 'Paulo Becker', 'gerente', NULL, 'Gerente Confinamento, Ypoti e Oro Verde', 'PB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pedro.moller', 'Pedro Moller', 'gerente', NULL, 'Gerente Santa Maria y Cielo Azul', 'PM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('laura.rivas', 'Laura Beatriz Rivas Britez', 'comprador', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Encargada Administrativa', 'LR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('elva.sanchez', 'Elva Marlene Sanchez Cabrera', 'comprador', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Encargada Depósito y Taller', 'ES', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('isidro.romero', 'Isidro Javier Romero Benitez', 'comprador', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Basculero', 'IR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('edison.vega', 'Edison Ronaldo Vega Arce', 'comprador', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Asistente Confinamento', 'EV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rodrigo.carvalho', 'Rodrigo Carvalho', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Coordenador Confinamento', 'RC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('alvaro.cuevas', 'Alvaro Cuevas', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Supervisor Confinamento', 'AC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('arsenio.alen', 'Arsenio Alen', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Seguridad', 'AA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('moises.lima', 'Moises Lima', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Supervisor Confinamento', 'ML', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('anastacio.domingues', 'Anastacio Domingues', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Seguridad Domingo', 'AD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('alberto.cabanas', 'Alberto Vidal Cabañas Fretes', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Mecanico', 'AC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('cristobal.ortigoza', 'Cristobal Ortigoza Lopez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Palero', 'CO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fernando.fretes', 'Fernando Fretes Mareco', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Chofer', 'FF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('herminio.aquino', 'Herminio Aquino Gonzalez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Palero', 'HA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('julio.ariel', 'Julio Ariel', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tractorista John Deere', 'JA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('leonardo.ovelar', 'Leonardo Ovelar Ocampos', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tractorista', 'LO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('oscar.caballero', 'Oscar Antonio Caballero Vera', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Chofer', 'OC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('patrocinio.morel', 'Patrocinio Morel', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Palero', 'PM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pedro.ferreira', 'Pedro Aníbal Ferreira Arguello', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Empleado', 'PF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('robert.zalazar', 'Robert Zalazar', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Palero', 'RZ', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rody.gayoso', 'Rody Gayoso', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tractorista Valtra 194', 'RG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('jefferson.gutierrez', 'Jefferson Gutierrez Aquino', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Auxiliar Mecanico', 'JG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('emerenciano.riquelme', 'Emerenciano Riquelme Coronel', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Encargado Fabrica', 'ER', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('edizon.toledo', 'Edizon Toledo Ocampos', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Ayudante Fábrica', 'ET', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pascual.dos', 'Pascual Dos Santos', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Ayudante Fábrica', 'PD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pio.riquelme', 'Pio Celso Riquelme Coronel', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Ayudante Fabrica', 'PR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('sebastian.ramos', 'Sebastian Ramos Candia', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Ayudante Fábrica', 'SR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('sixto.ovelar', 'Sixto Ovelar', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Auxiliar Fábrica (vacaju)', 'SO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('alder.acosta', 'Alder Martin Acosta Arevalos', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Auxiliar de Servicios Generales', 'AA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('bernardo.diaz', 'Bernardo Diaz Villamayor', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Auxiliar de Servicios Generales', 'BD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('lucio.vega', 'Lucio Vega', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Auxiliar de Servicios Generales (vacaju)', 'LV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nestor.escobar', 'Nestor Escobar Ramos', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Auxiliar de Servicios Generales', 'NE', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('oscar.paez', 'Oscar Ruben Paez Nuñez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Auxiliar de Servicios Generales Confinamiento', 'OP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('tito.tomas', 'Tito Tomas', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tractorista Confinamiento', 'TT', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('isaias.riquelme', 'Isaias Basilio Riquelme Coronel', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Capataz Confinamento', 'IR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('cesar.arguello', 'Cesar Arguello Gonzalez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero Ronda Confinamento', 'CA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('heriberto.moral', 'Heriberto Moral Gimenez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero Ronda Confinamento', 'HM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('marcelo.pimentel', 'Marcelo Ivan Pimentel', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero Ronda Confinamento', 'MP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fidel.coronel', 'Fidel Coronel Villamayor', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Palero Confinamiento', 'FC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('francisco.arce', 'Francisco Arce', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tratador Confinamiento', 'FA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hugo.javier', 'Hugo Javier Florenciano', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tratador Confinamiento', 'HJ', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('julio.villamayor', 'Julio Ariel Villamayor Fretez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tractorista Confinamiento', 'JV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nery.paez', 'Nery Paez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tratador Confinamiento', 'NP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('oscar.candia', 'Oscar David Candia Cañiza', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tratador Confinamiento', 'OC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('richar.mendoza', 'Richar Mendoza Ferreira', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tratador Confinamiento', 'RM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('victor.ramon', 'Victor Ramon Pereira', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Tratador Confinamiento', 'VR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('adolfina.bareiro', 'Adolfina Bareiro', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Cocinera', 'AB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('oscar.penayo', 'Oscar Gabriel Penayo Cardozo', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Portonero', 'OP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('edgar.gonzalez', 'Edgar Raul Gonzalez Ortiz', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Portonero', 'EG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('myrian.bareiro', 'Myrian Ysabel Bareiro Riquelme', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Cocinera', 'MB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('evaristo.ortigoza', 'Evaristo Ortigoza', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Encargado Mantenimiento Plomeria, Cerca Elétrica, Casa', 'EO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('arnaldo.vargas', 'Arnaldo Vargas Larrea', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Ayudante Mantenimiento Plomeria, Cerca Elétrica, Casa', 'AV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('silvio.salinas', 'Silvio Ciriaco Salinas', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Ayudante Mantenimiento Plomeria, Cerca Elétrica, Casa', 'SS', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('juan.paranderi', 'Juan Diego Paranderi Monges', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Supervisor Recria', 'JP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('eduardo.cuevas', 'Eduardo Antonio Cuevas Urbieta', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Capataz General', 'EC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('evaristo.ocampo', 'Evaristo Ocampo Vega', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Salgador', 'EO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('richard.vento', 'Richard Daniel Vento Larrea', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero', 'RV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('antonio.dominguez', 'Antonio Ceveriano Dominguez Valdez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero', 'AD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('emigdio.carballo', 'Emigdio Carballo Arce', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero', 'EC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('luciano.aguirre', 'Luciano Aguirre Osorio', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero', 'LA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('luciano.vargas', 'Luciano Vargas Larrea', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero', 'LV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nestor.cuevas', 'Nestor Emigdio Cuevas Urbieta', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Capataz Retiro', 'NC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('obidio.ledesma', 'Obidio Javier Ledesma Martinez', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero', 'OL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pancracio.arguello', 'Pancracio Arguello', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero', 'PA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('reginaldo.de', 'Reginaldo de Almeida Reis', 'lider', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Capataz de Retiro', 'RD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('richard.vento2', 'Richard Vento', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero', 'RV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('renato.vera', 'Renato Vera Nogueira', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero Retiro', 'RV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('narlo.zorrilla', 'Narlo Arístides Zorrilla Paredes', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Campero Retiro', 'NZ', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('cristian.larrea', 'Cristian Larrea', 'solicitante', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1), 'Compostaje', 'CL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('eliseo.cabanas', 'Eliseo Cabañas Lopez', 'lider', (SELECT id FROM establishments WHERE name='Oro Verde' LIMIT 1), 'Capataz', 'EC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('freddy.gomez', 'Freddy Gomez', 'solicitante', (SELECT id FROM establishments WHERE name='Oro Verde' LIMIT 1), 'Seguridad', 'FG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('david.aquino', 'David Javier Aquino Bogado', 'solicitante', (SELECT id FROM establishments WHERE name='Oro Verde' LIMIT 1), 'Campero', 'DA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('henrique.caceres', 'Henrique Caceres', 'comprador', NULL, 'Asistente Adm Estancia', 'HC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('elias.duarte', 'Elias Duarte', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Tratorista', 'ED', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('eliodoro.famoso', 'Eliodoro Famoso', 'lider', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Capataz Retiro', 'EF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('virgilio.ortigoza', 'Virgilio Ortigoza', 'lider', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Capataz', 'VO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('abel.cabanas', 'Abel Cabanas', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Campero', 'AC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('agenor.centurion', 'Agenor Centurion', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Campero', 'AC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('bruno.antonio', 'Bruno Antonio', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Campero', 'BA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('renato.flores', 'Renato Flores', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Campero', 'RF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nilson.centurion', 'Nilson Centurion', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Menor Campero', 'NC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('roque.maciel', 'Roque Maciel', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Ayudante Tratorista', 'RM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('cristian.moreno', 'Cristian Moreno', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), 'Campero', 'CM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('cristian.martinez', 'Cristian Martinez', 'solicitante', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Tractorista', 'CM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nilton.dornelis', 'Nilton Cesar Dornelis', 'lider', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Capataz', 'ND', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ricardo.ramirez', 'Ricardo Ramirez', 'lider', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Capataz Retiro', 'RR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pablo.gonzales', 'Pablo Gonzales', 'solicitante', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Ayudante Tractorista', 'PG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('jonathan.ramirez', 'Jonathan Ramirez Cuba', 'solicitante', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Campero', 'JR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('silvio.gabriel', 'Silvio Gabriel Villalba Martinez', 'solicitante', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Campero', 'SG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('blas.fernandez', 'Blas Fernandez', 'solicitante', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Campero', 'BF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('derliz.lopez', 'Derliz Lopez', 'solicitante', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Campero', 'DL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fabricio.concepcion', 'Fabricio Concepcion Dornelis', 'solicitante', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1), 'Campero', 'FC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ramon.sosa', 'Ramon Sosa', 'comprador', NULL, 'Asistente Adm Estancia', 'RS', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('vidal.acosta', 'Vidal Acosta', 'lider', (SELECT id FROM establishments WHERE name='Ybypora' LIMIT 1), 'Capataz', 'VA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('daniel.acosta', 'Daniel Acosta', 'solicitante', (SELECT id FROM establishments WHERE name='Ybypora' LIMIT 1), 'Campero', 'DA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('german.rodas', 'German Rodas Añazco', 'solicitante', (SELECT id FROM establishments WHERE name='Ybypora' LIMIT 1), 'Campero', 'GR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('manuel.acosta', 'Manuel Acosta Franco', 'solicitante', (SELECT id FROM establishments WHERE name='Ybypora' LIMIT 1), 'Campero', 'MA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('sanabria.de', 'Sanabria de Los Santos', 'solicitante', (SELECT id FROM establishments WHERE name='Ybypora' LIMIT 1), 'Campero', 'SD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('victor.acosta', 'Victor Acosta', 'solicitante', (SELECT id FROM establishments WHERE name='Ybypora' LIMIT 1), 'Campero', 'VA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('candelario.lopez', 'Candelario Lopez', 'solicitante', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Mantenimiento Casa Patronal', 'CL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('demesio.romero', 'Demesio Romero', 'solicitante', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Mantenimiento Plomeria, Carpinteria y Alambrado', 'DR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('eladio.romero', 'Eladio Romero', 'lider', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Jefe Fábrica', 'ER', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('josival.ferreira', 'Josival Francisco Ferreira', 'solicitante', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Playero', 'JF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('leandro.da', 'Leandro da Silva Souza', 'lider', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Capataz', 'LD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('narciso.martinez', 'Narciso Martinez Vera', 'lider', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Capataz Retiro', 'NM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rolando.lopez', 'Rolando Lopez', 'solicitante', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Tractorista', 'RL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('bruno.romero', 'Bruno Romero', 'solicitante', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Ayudante Fábrica', 'BR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('carlos.figueira', 'Carlos Eduardo Figueira Alves', 'solicitante', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Campero', 'CF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('leonel.da', 'Leonel da Silva Lopez', 'solicitante', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), 'Campero', 'LD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('isidro.villalba', 'Isidro Villalba', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Clara' LIMIT 1), 'Tractorista', 'IV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pedro.alvarez', 'Pedro Alvarez', 'solicitante', (SELECT id FROM establishments WHERE name='Santa Clara' LIMIT 1), 'Seguridad', 'PA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ever.cristaldo', 'Ever Cristaldo', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Mantenimiento y Servicios Generales', 'EC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hector.irala', 'Hector Irala', 'lider', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Capataz', 'HI', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('clotildo.acosta', 'Clotildo Acosta', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Campero', 'CA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('elias.duartes', 'Elias Duartes', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Campero', 'ED', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nelson.cristado', 'Nelson Cristado', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Campero', 'NC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nicolas.molina', 'Nicolas Molina', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Campero', 'NM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('victor.vera', 'Victor Vera', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Campero', 'VV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('epifanio.benitez', 'Epifanio Benitez', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Auxiliar Tractorista', 'EB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fidel.benitez', 'Fidel Benitez', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Tractorista', 'FB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ramon.ojeda', 'Ramon Ojeda', 'solicitante', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1), 'Tractorista', 'RO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('gabriel', 'Gabriel Moller', 'gerente', NULL, 'Gerente Adminsitrativo', 'GM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('anahi', 'Anahi Raquel Aguirre de Leiva', 'comprador', NULL, 'Supervisora Administrativa', 'AA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('alex.samudio', 'Alex Samudio', 'solicitante', NULL, 'Servicios Generales', 'AS', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ana.karina', 'Ana Karina Ticianelli Moller', 'gerente', NULL, 'Gerente Financeira', 'AT', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('kelin', 'Kelin Bradshav', 'comprador', NULL, 'Analista de Pagos', 'KB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('lucas.enrico', 'Lucas Enrico', 'gerente', NULL, 'Gerente de Estrategia Financeira', 'LE', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('leticia.gonzalez', 'Leticia Gonzalez', 'comprador', NULL, 'Supervisora Contable', 'LG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('freddy.prodato', 'Freddy Prodato', 'solicitante', NULL, '(reemplazo Leticia)', 'FP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('renzo.miltos', 'Renzo Miltos', 'comprador', NULL, 'Auxiliar Contable', 'RM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('guillermo', 'Guillermo Caceres', 'comprador', NULL, 'Auxiliar Contable', 'GC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('paola.rios', 'Paola Rios', 'comprador', NULL, 'Auxiliar Contable', 'PR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('eduardo.olivetti', 'Eduardo Ivan Olivetti Gaona', 'solicitante', NULL, 'Certificador', 'EO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('guillermo.encina', 'Guillermo Encina', 'solicitante', NULL, 'Empleado', 'GE', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('adalberto.cuevas', 'Adalberto Cuevas', 'lider', NULL, 'Capataz', 'AC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('albino.lopez', 'Albino Lopez', 'lider', NULL, 'Capataz', 'AL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('alex.vega', 'Alex Vega', 'solicitante', NULL, 'Campero', 'AV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('alexis.ramon', 'Alexis Ramon Gomez', 'solicitante', NULL, 'Campero', 'AR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('alvaro.cuevas2', 'Alvaro Cuevas Urbieta', 'gerente', NULL, 'Gerente de Pasto', 'AC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('angel.loreto', 'Angel Loreto Paez Caceres', 'solicitante', NULL, 'Repartidor de Sal', 'AL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('candido.ocampos', 'Candido Ocampos Ovelar', 'solicitante', NULL, 'Seguridad', 'CO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('carlos.eduardo', 'Carlos Eduardo', 'lider', NULL, 'Capataz', 'CE', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('carlos.alves', 'Carlos Eduardo Alves', 'solicitante', NULL, 'Campero', 'CA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('celso.riquelme', 'Celso Riquelme', 'solicitante', NULL, 'Ayudante Fabrica', 'CR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('celso.riquelmo', 'Celso Riquelmo', 'solicitante', NULL, 'Ayudante Fabrica', 'CR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('claudia.acosta', 'Claudia Acosta', 'solicitante', NULL, 'Servicio Domestico y Cocinera', 'CA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('claudia.acosta2', 'Claudia Acosta Noguera', 'solicitante', NULL, 'Cocinera', 'CA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('clotildo.acosta2', 'Clotildo Acosta Noguera', 'solicitante', NULL, 'Campero', 'CA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('cristian.damian', 'Cristian Damian Sosa Benitez', 'lider', NULL, 'Líder de Limpieza', 'CD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('cristian.larrea2', 'Cristian Larrea Arevalos', 'solicitante', NULL, 'Tractorista', 'CL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('cristobal.coronel', 'Cristobal Coronel', 'solicitante', NULL, 'Mecanico', 'CC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('del.paredes', 'Del Rosario Paredes', 'solicitante', NULL, 'Campero', 'DP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('edgar.x', 'Edgar', 'lider', NULL, 'Líder Mantenimiento', 'EX', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('eduardo.cuevas2', 'Eduardo Cuevas', 'lider', NULL, 'Capataz General', 'EC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('efigenio.vargas', 'Efigenio Vargas', 'solicitante', NULL, 'Ayudante Fabrica', 'EV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('efigenio.vargas2', 'Efigenio Vargas Larrea', 'solicitante', NULL, 'Molinador', 'EV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('emerenciano.riquelme2', 'Emerenciano Riquelme', 'solicitante', NULL, 'Fabrica', 'ER', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('emerenciano.riquelme3', 'Emerenciano Riquelme Coronel', 'lider', NULL, 'Líder Fabrica', 'ER', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('epifanio.miranda', 'Epifanio Miranda', 'solicitante', NULL, 'Ayudante Seguridad', 'EM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('epinafio.benitez', 'Epinafio Benitez', 'solicitante', NULL, 'Auxiliar Tractorista', 'EB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('erson.paredes', 'Erson Bruno Paredes', 'lider', NULL, 'Capataz', 'EP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('eumelio.fernandez', 'Eumelio Fernandez', 'solicitante', NULL, 'Tratador', 'EF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('eumelio.villamayor', 'Eumelio Villamayor Fernandez', 'solicitante', NULL, 'Tractorista', 'EV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('evaristo.ortigoza2', 'Evaristo Ortigoza Gimenez', 'lider', NULL, 'Líder Mantenimiento', 'EO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ever.cristaldo2', 'Ever Leonor Cristaldo Ricardi', 'lider', NULL, 'Líder Mantenimiento', 'EC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('favio.ramon', 'Favio Ramon Gabilan', 'solicitante', NULL, 'Auxiliar de Mantenimiento', 'FR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('felipe.villalba', 'Felipe Villalba', 'solicitante', NULL, 'Campero', 'FV', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fernando.da', 'Fernando da Silva', 'solicitante', NULL, 'Campero', 'FD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fernando.duarte', 'Fernando Duarte', 'comprador', NULL, 'Administrativo', 'FD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fernando.dima', 'Fernando Rafael Dima Bareiro', 'solicitante', NULL, 'Auxiliar de Mantenimiento', 'FD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fidel.coronel2', 'Fidel Coronel', 'solicitante', NULL, 'Palero', 'FC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('floriano.britez', 'Floriano Britez Mendoza', 'solicitante', NULL, 'Campero', 'FB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('freddy.mariano', 'Freddy Mariano', 'solicitante', NULL, 'Seguridad', 'FM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('fredy.larrea', 'Fredy Larrea Arevalos', 'solicitante', NULL, 'Auxiliar de Mantenimiento', 'FL', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('gimenez.hugo', 'Gimenez Gonzalez Hugo Miguel', 'solicitante', NULL, 'Campero', 'GH', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hector.irala2', 'Hector Irala Figueredo', 'lider', NULL, 'Capataz', 'HI', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('herminio.aquino2', 'Herminio Aquino', 'solicitante', NULL, 'Palero', 'HA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hernan.britez', 'Hernan Hermogenes Britez Baez', 'solicitante', NULL, 'Campero', 'HB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hugo.coronel', 'Hugo Coronel', 'solicitante', NULL, 'Tratador', 'HC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hugo.florenciano', 'Hugo Florenciano', 'solicitante', NULL, 'Tratador', 'HF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hugo.gimenez', 'Hugo Gimenez', 'solicitante', NULL, 'Ronda Sanitaria', 'HG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hugo.riquelme', 'Hugo Riquelme Coronel', 'solicitante', NULL, 'Tratador', 'HR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hugo.riquelme2', 'Hugo David Riquelme Coronel', 'solicitante', NULL, 'Tratador', 'HR', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hugo.florenciano2', 'Hugo Javier Florenciano Arevalos', 'solicitante', NULL, 'Tratador', 'HF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('hugo.gimenez2', 'Hugo Miguel Gimenez Gonzalez', 'solicitante', NULL, 'Campero', 'HG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('irio.cohene', 'Irio Cohene', 'solicitante', NULL, 'Campero', 'IC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('irio.freisleben', 'Irio Freisleben Cohene', 'solicitante', NULL, 'Campero', 'IF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('jhovanny.bareiro', 'Jhovanny Bareiro', 'solicitante', NULL, 'Campero', 'JB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('juan.aquino', 'Juan Aquino', 'solicitante', NULL, 'Surpevisor Confinamento', 'JA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('juan.gonzales', 'Juan Gonzales', 'lider', NULL, 'Encargado Confinamiento', 'JG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('juan.gonzales2', 'Juan Aquino Gonzales', 'solicitante', NULL, 'Auxiliar Fabrica', 'JG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('justimiano.carreras', 'Justimiano Carreras', 'solicitante', NULL, 'Portonero Nucleo 6', 'JC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('lisandro.espinoza', 'Lisandro Espinoza', 'solicitante', NULL, 'Tractorista', 'LE', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('manuel.duarte', 'Manuel Duarte', 'solicitante', NULL, 'Campero', 'MD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('mateo.caballero', 'Mateo Caballero', 'comprador', NULL, 'Contabilidad', 'MC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('matias.alves', 'Matias Alves', 'solicitante', NULL, 'Campero', 'MA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('mauricio.martinez', 'Mauricio Martinez', 'solicitante', NULL, 'Campero', 'MM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('mauricio', 'Mauricio Moller', 'diretoria', NULL, 'Presidente', 'MM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('meliano.duarte', 'Meliano Duarte', 'solicitante', NULL, 'Campero', 'MD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('meliano.duarte2', 'Meliano Duarte Morinigo', 'lider', NULL, 'Líder Ronda Sanitaria', 'MD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('milder.medina', 'Milder Medina', 'solicitante', NULL, 'Campero', 'MM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nelson.morel', 'Nelson Morel', 'lider', NULL, 'Capataz Retiro Sur', 'NM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nelson.morel2', 'Nelson Morel Vega', 'lider', NULL, 'Capataz', 'NM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nelson.cristaldo', 'Nelson Tomas Cristaldo Ricardi', 'solicitante', NULL, 'Campero', 'NC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('nery.paez2', 'Nery Paez', 'solicitante', NULL, 'Molinador de Heno', 'NP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('oscar.paez2', 'Oscar Paez', 'solicitante', NULL, 'Lavador Pileta', 'OP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('oscar.carmona', 'Oscar Adan Carmona Villalba', 'solicitante', NULL, 'Auxiliar Fabrica', 'OC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('oscar.paredes', 'Oscar David Paredes', 'solicitante', NULL, 'Campero', 'OP', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pablo.de', 'Pablo de Moraes de Silva', 'lider', NULL, 'Capataz General', 'PD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pedro.blanco', 'Pedro Blanco Nolasco', 'solicitante', NULL, 'Campero', 'PB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('pedro.nolasco', 'Pedro Nolasco', 'solicitante', NULL, 'Campero', 'PN', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rafael.dima', 'Rafael Dima', 'solicitante', NULL, 'Cuidador', 'RD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rafael.dima2', 'Rafael Dima Minela', 'solicitante', NULL, 'Seguridad', 'RD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ramon.sosa2', 'Ramon Sosa Oliveira', 'solicitante', NULL, 'Campero', 'RS', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ramon.ojeda2', 'Ramon Ojeda Ojeda', 'solicitante', NULL, 'Tractorista', 'RO', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ranulfo.martinez', 'Ranulfo Martinez', 'lider', NULL, 'Capataz', 'RM', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ricardo.arguello', 'Ricardo Arguello', 'solicitante', NULL, 'Ayudante Ronda Sanitaria', 'RA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ricardo.cardozo', 'Ricardo Cardozo Curtido', 'solicitante', NULL, 'Campero', 'RC', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ricardo.dos', 'Ricardo Dos Santos Soares', 'solicitante', NULL, 'Auxiliar Ronda Sanitária', 'RD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('ricardo.soares', 'Ricardo Soares', 'solicitante', NULL, 'Campero', 'RS', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('richard.silva', 'Richard David Silva Insfran', 'solicitante', NULL, 'Campero', 'RS', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('robert.salazar', 'Robert Salazar', 'solicitante', NULL, 'Palero', 'RS', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rodolfo.arevalos', 'Rodolfo Arevalos', 'solicitante', NULL, 'Palero', 'RA', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rodolfo.florenciano', 'Rodolfo Florenciano', 'solicitante', NULL, 'Palero', 'RF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rodolfo.florenciano2', 'Rodolfo Florenciano Arevalos', 'solicitante', NULL, 'Molinador', 'RF', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rodrigo.dosanto', 'Rodrigo Dosanto Gayozo', 'solicitante', NULL, 'Responsable Confinamiento', 'RD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rolando.benitez', 'Rolando Benitez Gonzalez', 'lider', NULL, 'Palero y Jefe de Maquinas', 'RB', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rosevaldo.dos', 'Rosevaldo Dos Santo Bonfauche', 'gerente', NULL, 'Gerente', 'RD', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('rufino.gomez', 'Rufino Gomez', 'solicitante', NULL, 'Campero', 'RG', true, true);
INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES ('victor.dima', 'Victor Dima', 'solicitante', NULL, 'Campero', 'VD', true, true);

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT role, count(*) as cnt FROM profiles GROUP BY role ORDER BY role;
