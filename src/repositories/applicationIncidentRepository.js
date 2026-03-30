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
        payload_erro,
        data_hora,
        status_code_error
      )
      VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7::jsonb, $8::timestamptz, $9)
      RETURNING *
    `,
    [
      payload.ticket_owner_id,
      payload.x_fapi_interaction_id,
      payload.authorization_server,
      payload.client_id,
      payload.endpoint,
      payload.method,
      JSON.stringify(payload.error_payload),
      payload.occurred_at,
      payload.http_status_code,
    ]
  );

  return result.rows[0] || null;
}

async function listIncidentsByOwnerSlug(ownerSlug) {
  const result = await getPool().query(
    `
      SELECT
        ai.*,
        towner.slug AS team_slug,
        towner.name AS team_name
      FROM application_incidents ai
      JOIN ticket_owners towner
        ON towner.id = ai.ticket_owner_id
      WHERE towner.slug = $1
        AND towner.is_active = TRUE
      ORDER BY ai.data_hora DESC, ai.id DESC
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
        towner.name AS team_name
      FROM application_incidents ai
      JOIN ticket_owners towner
        ON towner.id = ai.ticket_owner_id
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
      UPDATE application_incidents ai
      SET incident_status = $3,
          assigned_to_user_id = $4,
          assigned_to_name = $5,
          assigned_to_email = $6,
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
      payload.assigned_to_user_id || null,
      payload.assigned_to_name || null,
      payload.assigned_to_email || null,
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
