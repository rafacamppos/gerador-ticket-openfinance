INSERT INTO category_templates (
  id,
  category_name,
  sub_category_name,
  third_level_category_name,
  template_id,
  type
) VALUES
  (
    547,
    'Erro na Jornada ou Dados',
    'Obtendo um Consentimento',
    'Criação de Consentimento',
    123328,
    1
  )
ON CONFLICT (id) DO UPDATE
SET
  category_name = EXCLUDED.category_name,
  sub_category_name = EXCLUDED.sub_category_name,
  third_level_category_name = EXCLUDED.third_level_category_name,
  template_id = EXCLUDED.template_id,
  type = EXCLUDED.type;
