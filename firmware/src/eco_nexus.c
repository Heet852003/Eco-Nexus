#include "eco_nexus.h"

#include <stdlib.h>

typedef struct {
    int in_use;
    eco_proposal_t proposal;
    eco_decision_t decision;
} eco_session_t;

static eco_session_t *g_sessions = NULL;
static size_t g_max_sessions = 0;

static eco_decision_kind_t choose_decision(double score)
{
    if (score >= 80.0) {
        return ECO_DECISION_ACCEPT;
    }
    if (score >= 60.0) {
        return ECO_DECISION_COMPARE;
    }
    return ECO_DECISION_REJECT;
}

int eco_init_engine(size_t max_sessions)
{
    if (max_sessions == 0) {
        return -1;
    }

    g_sessions = (eco_session_t *)calloc(max_sessions, sizeof(eco_session_t));
    if (!g_sessions) {
        return -1;
    }

    g_max_sessions = max_sessions;
    return 0;
}

int eco_submit_proposal(int session_id, const eco_proposal_t *proposal)
{
    if (!g_sessions || !proposal) {
        return -1;
    }

    if (session_id < 0 || (size_t)session_id >= g_max_sessions) {
        return -1;
    }

    eco_session_t *s = &g_sessions[session_id];
    s->in_use = 1;
    s->proposal = *proposal;

    s->decision.session_id = session_id;
    s->decision.final_score = proposal->ml_score;
    s->decision.kind = choose_decision(proposal->ml_score);

    return 0;
}

int eco_get_decision(int session_id, eco_decision_t *out)
{
    if (!g_sessions || !out) {
        return -1;
    }

    if (session_id < 0 || (size_t)session_id >= g_max_sessions) {
        return -1;
    }

    eco_session_t *s = &g_sessions[session_id];
    if (!s->in_use) {
        return -1;
    }

    *out = s->decision;
    return 0;
}

void eco_shutdown_engine(void)
{
    free(g_sessions);
    g_sessions = NULL;
    g_max_sessions = 0;
}

