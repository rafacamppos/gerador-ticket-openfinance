const { getPool } = require('../clients/postgresClient');

async function createIncident(payload) {
  const result = await getPool().query(
    `
      INSERT INTO application_incidents (
        ticket_owner_id,
        x_fapi_interaction_id,
        authorization_server,
        client_id,
        endpoint,
        method,
        payload_request,
        payload_response,
        occurred_at,
        http_status_code,
        description
      )
      VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7::jsonb, $8::jsonb, $9::timestamptz, $10, $11)
      RETURNING *
    `,
    [
      payload.ticket_owner_id,
      payload.x_fapi_interaction_id,
      payload.authorization_server,
      payload.client_id,
      payload.endpoint,
      payload.method,
      JSON.stringify(payload.payload_request),
      JSON.stringify(payload.payload_response),
      payload.occurred_at,
      payload.http_status_code,
      payload.description,
    ]
  );

  return result.rows[0] || null;
}

async function listIncidentsByOwnerSlug(ownerSlug, { limit = null, offset = 0 } = {}) {
  const limitClause = limit ? `LIMIT ${Number(limit)}` : '';
  const offsetClause = offset > 0 ? `OFFSET ${Number(offset)}` : '';

  const result = await getPool().query(
    `
      SELECT
        ai.*,
        towner.slug AS team_slug,
        towner.name AS team_name,
        tu.name AS assigned_to_name,
        tu.email AS assigned_to_email
      FROM application_incidents ai
      JOIN ticket_owners towner
        ON towner.id = ai.ticket_owner_id
      LEFT JOIN ticket_users tu
        ON tu.id = ai.assigned_to_user_id
      WHERE towner.slug = $1
        AND towner.is_active = TRUE
      ORDER BY ai.occurred_at DESC, ai.id DESC
      ${limitClause}
      ${offsetClause}
    `,
    [ownerSlug]
  );

  return result.rows;
}

async function getIncidentById(ownerSlug, incidentId) {
  const result = await getPool().query(
    `
      SELECT
        ai.*,
        towner.slug AS team_slug,
        towner.name AS team_name,
        tu.name AS assigned_to_name,
        tu.email AS assigned_to_email
      FROM application_incidents ai
      JOIN ticket_owners towner
        ON towner.id = ai.ticket_owner_id
      LEFT JOIN ticket_users tu
        ON tu.id = ai.assigned_to_user_id
      WHERE towner.slug = $1
        AND ai.id = $2
        AND towner.is_active = TRUE
      LIMIT 1
    `,
    [ownerSlug, Number(incidentId)]
  );

  return result.rows[0] || null;
}

async function assignIncidentToUser(ownerSlug, incidentId, payload) {
  const result = await getPool().query(
    `
      WITH updated AS (
        UPDATE application_incidents ai
        SET incident_status = $3,
            assigned_to_user_id = $4,
            updated_at = NOW()
        FROM ticket_owners towner
        WHERE towner.id = ai.ticket_owner_id
          AND towner.slug = $1
          AND ai.id = $2
          AND towner.is_active = TRUE
        RETURNING
          ai.*,
          towner.slug AS team_slug,
          towner.name AS team_name
      )
      SELECT
        u.*,
        tu.name AS assigned_to_name,
        tu.email AS assigned_to_email
      FROM updated u
      LEFT JOIN ticket_users tu ON tu.id = u.assigned_to_user_id
    `,
    [
      ownerSlug,
      Number(incidentId),
      payload.incident_status,
      payload.assigned_to_user_id || null,
    ]
  );

  return result.rows[0] || null;
}

async function transitionIncident(ownerSlug, incidentId, payload) {
  const result = await getPool().query(
    `
      UPDATE application_incidents ai
      SET incident_status = $3,
          related_ticket_id = $4,
          updated_at = NOW()
      FROM ticket_owners towner
      WHERE towner.id = ai.ticket_owner_id
        AND towner.slug = $1
        AND ai.id = $2
        AND towner.is_active = TRUE
      RETURNING
        ai.*,
        towner.slug AS team_slug,
        towner.name AS team_name
    `,
    [
      ownerSlug,
      Number(incidentId),
      payload.incident_status,
      payload.related_ticket_id ?? null,
    ]
  );

  return result.rows[0] || null;
}

module.exports = {
  assignIncidentToUser,
  createIncident,
  getIncidentById,
  listIncidentsByOwnerSlug,
  transitionIncident,
};
