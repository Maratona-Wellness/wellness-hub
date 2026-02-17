-- Criar Roles (se não existirem)
INSERT INTO roles (id, role_name, created_at) VALUES
  (gen_random_uuid(), 'EMPLOYEE', NOW()),
  (gen_random_uuid(), 'THERAPIST', NOW()),
  (gen_random_uuid(), 'TENANT_ADMIN', NOW()),
  (gen_random_uuid(), 'SUPER_ADMIN', NOW())
ON CONFLICT (role_name) DO NOTHING;

-- Criar THERAPIST
DO $$
DECLARE
  v_tenant_id uuid;
  v_therapist_role_id uuid;
  v_therapist_user_id uuid;
BEGIN
  -- Pegar tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE domain = 'teste.com' LIMIT 1;
  
  -- Pegar role THERAPIST
  SELECT id INTO v_therapist_role_id FROM roles WHERE role_name = 'THERAPIST';
  
  -- Criar UserAccount
  INSERT INTO user_accounts (id, email, password_hash, display_name, active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'therapist@teste.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyUI3ppL2eMK', 'Terapeuta Teste', true, NOW(), NOW())
  RETURNING id INTO v_therapist_user_id;
  
  -- Vincular ao Role
  INSERT INTO user_roles (id, user_id, role_id, tenant_id, created_at)
  VALUES (gen_random_uuid(), v_therapist_user_id, v_therapist_role_id, v_tenant_id, NOW());
  
  -- Criar registro Therapist
  INSERT INTO therapists (id, user_id, email, name, cpf, active, created_at, updated_at)
  VALUES (gen_random_uuid(), v_therapist_user_id, 'therapist@teste.com', 'Terapeuta Teste', '12345678901', true, NOW(), NOW());
END $$;

-- Criar TENANT_ADMIN
DO $$
DECLARE
  v_tenant_id uuid;
  v_admin_role_id uuid;
  v_admin_user_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE domain = 'teste.com' LIMIT 1;
  SELECT id INTO v_admin_role_id FROM roles WHERE role_name = 'TENANT_ADMIN';
  
  INSERT INTO user_accounts (id, email, password_hash, display_name, active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'admin@teste.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyUI3ppL2eMK', 'Admin Teste', true, NOW(), NOW())
  RETURNING id INTO v_admin_user_id;
  
  INSERT INTO user_roles (id, user_id, role_id, tenant_id, created_at)
  VALUES (gen_random_uuid(), v_admin_user_id, v_admin_role_id, v_tenant_id, NOW());
END $$;

-- Criar SUPER_ADMIN
DO $$
DECLARE
  v_super_role_id uuid;
  v_super_user_id uuid;
BEGIN
  SELECT id INTO v_super_role_id FROM roles WHERE role_name = 'SUPER_ADMIN';
  
  INSERT INTO user_accounts (id, email, password_hash, display_name, active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'superadmin@teste.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyUI3ppL2eMK', 'Super Admin', true, NOW(), NOW())
  RETURNING id INTO v_super_user_id;
  
  -- SUPER_ADMIN tem tenantId NULL
  INSERT INTO user_roles (id, user_id, role_id, tenant_id, created_at)
  VALUES (gen_random_uuid(), v_super_user_id, v_super_role_id, NULL, NOW());
END $$;