ALTER TABLE ticket_flow_states
  DROP CONSTRAINT IF EXISTS chk_ticket_flow_states_stage;

ALTER TABLE ticket_flow_states
  ADD CONSTRAINT chk_ticket_flow_states_stage CHECK (
    current_stage IN (
      'triage_su',
      'routed_to_owner',
      'accepted_by_owner',
      'returned_to_su',
      'responded_by_owner',
      'closed_canceled'
    )
  );

ALTER TABLE ticket_flow_events
  DROP CONSTRAINT IF EXISTS chk_ticket_flow_events_action;

ALTER TABLE ticket_flow_events
  ADD CONSTRAINT chk_ticket_flow_events_action CHECK (
    action IN (
      'route_to_owner',
      'accept',
      'respond',
      'return_to_su',
      'reject',
      'canceled',
      'closed'
    )
  );
