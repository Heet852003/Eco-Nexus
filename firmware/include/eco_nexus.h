#ifndef ECO_NEXUS_H
#define ECO_NEXUS_H

#include <stddef.h>

typedef struct {
    double price_today;
    int delivery_days;
    int local_flag_numeric;
    double past_sustainability_avg;
    double ml_score;
} eco_proposal_t;

typedef enum {
    ECO_DECISION_ACCEPT = 0,
    ECO_DECISION_COMPARE = 1,
    ECO_DECISION_REJECT = 2,
    ECO_DECISION_ERROR = 3
} eco_decision_kind_t;

typedef struct {
    int session_id;
    eco_decision_kind_t kind;
    double final_score;
} eco_decision_t;

int eco_init_engine(size_t max_sessions);
int eco_submit_proposal(int session_id, const eco_proposal_t *proposal);
int eco_get_decision(int session_id, eco_decision_t *out);
void eco_shutdown_engine(void);

#endif /* ECO_NEXUS_H */

