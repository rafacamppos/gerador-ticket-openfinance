const { getPool } = require('../clients/postgresClient');

async function getIncidentTicketContext(ownerSlug, incidentId) {
  const result = await getPool().query(
    `
      SELECT
        ai.id,
        ai.ticket_owner_id,
        ai.x_fapi_interaction_id,
        ai.authorization_server,
        ai.client_id,
        ai.endpoint,
        ai.method,
        ai.payload_request,
        ai.payload_response,
        ai.occurred_at,
        ai.http_status_code,
        ai.title,
        ai.description,
        ai.tipo_cliente,
        ai.canal_jornada,
        ai.incident_status,
        ai.related_ticket_id,
        ai.assigned_to_user_id,
        towner.slug  AS team_slug,
        towner.name  AS team_name,
        tu.name      AS assigned_to_name,
        tu.email     AS assigned_to_email,
        toe.category_template_id,
        ct.category_name,
        ct.sub_category_name,
        ct.third_level_category_name,
        ct.template_id,
        ct.type      AS template_type,
        av.api_name_version,
        av.api_version,
        av.product_feature,
        av.stage_name_version,
        COALESCE(st.financial_institution_name, towner.name) AS destinatario
      FROM application_incidents ai
      JOIN ticket_owners towner
        ON towner.id = ai.ticket_owner_id
      LEFT JOIN ticket_users tu
        ON tu.id = ai.assigned_to_user_id
      LEFT JOIN ticket_owner_endpoints toe
        ON toe.ticket_owner_id = ai.ticket_owner_id
        AND toe.endpoint = ai.endpoint
        AND toe.method   = ai.method
        AND toe.is_active = TRUE
      LEFT JOIN category_templates ct
        ON ct.id = toe.category_template_id
      LEFT JOIN endpoints ep
        ON ep.endpoint_url = ai.endpoint
        AND ep.http_method = ai.method
        AND ep.is_active   = TRUE
      LEFT JOIN api_versions av
        ON av.id = ep.api_version_id
      LEFT JOIN support_teams st
        ON st.auth_server = ai.authorization_server
        AND st.is_active  = TRUE
      WHERE towner.slug    = $1
        AND ai.id          = $2
        AND towner.is_active = TRUE
      LIMIT 1
    `,
    [ownerSlug, Number(incidentId)]
  );

  return result.rows[0] || null;
}

async function getTemplateFields(templateId) {
  const result = await getPool().query(
    `
      SELECT field_name, field_label_api, field_type, is_required, context_key, list_options
      FROM template_fields
      WHERE template_id = $1
      ORDER BY id ASC
    `,
    [Number(templateId)]
  );

  return result.rows;
}

module.exports = {
  getIncidentTicketContext,
  getTemplateFields,
};
