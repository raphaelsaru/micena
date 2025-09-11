-- Script para criar um usuário colaborador de teste
-- Execute este script no Supabase SQL Editor

-- Primeiro, insira o usuário na tabela auth.users
-- Substitua 'colaborador@teste.com' e 'senha123' pelos valores desejados
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'colaborador@teste.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
);

-- Em seguida, insira o perfil do usuário na tabela user_profiles
-- O trigger handle_new_user() deve fazer isso automaticamente, mas vamos garantir
INSERT INTO user_profiles (id, email, role)
SELECT 
  au.id,
  au.email,
  'colaborador'
FROM auth.users au
WHERE au.email = 'colaborador@teste.com'
ON CONFLICT (id) DO UPDATE SET role = 'colaborador';

-- Verificar se o usuário foi criado corretamente
SELECT 
  up.id,
  up.email,
  up.role,
  up.created_at
FROM user_profiles up
WHERE up.email = 'colaborador@teste.com';
