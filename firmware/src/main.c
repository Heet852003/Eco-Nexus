#include "eco_nexus.h"

#include <stdio.h>

static const char *decision_to_str(eco_decision_kind_t kind)
{
    switch (kind) {
    case ECO_DECISION_ACCEPT:
        return "ACCEPT";
    case ECO_DECISION_COMPARE:
        return "COMPARE";
    case ECO_DECISION_REJECT:
        return "REJECT";
    default:
        return "ERROR";
    }
}

int main(void)
{
    if (eco_init_engine(64) != 0) {
        fprintf(stderr, "Failed to init engine\n");
        return 1;
    }

    eco_proposal_t p = {
        .price_today = 100.0,
        .delivery_days = 7,
        .local_flag_numeric = 1,
        .past_sustainability_avg = 82.5,
        .ml_score = 84.0,
    };

    if (eco_submit_proposal(0, &p) != 0) {
        fprintf(stderr, "Failed to submit proposal\n");
        eco_shutdown_engine();
        return 1;
    }

    eco_decision_t d;
    if (eco_get_decision(0, &d) != 0) {
        fprintf(stderr, "Failed to get decision\n");
        eco_shutdown_engine();
        return 1;
    }

    printf("session=%d decision=%s score=%.2f\n", d.session_id, decision_to_str(d.kind), d.final_score);
    eco_shutdown_engine();
    return 0;
}

