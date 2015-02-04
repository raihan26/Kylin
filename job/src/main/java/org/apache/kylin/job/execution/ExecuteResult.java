package org.apache.kylin.job.execution;

import com.google.common.base.Preconditions;

/**
 * Created by qianzhou on 12/15/14.
 */
public final class ExecuteResult {

    public static enum State {SUCCEED, FAILED, ERROR, DISCARDED, STOPPED}

    private final State state;
    private final String output;

    public ExecuteResult(State state) {
        this(state, "");
    }

    public ExecuteResult(State state, String output) {
        Preconditions.checkArgument(state != null, "state cannot be null");
        this.state = state;
        this.output = output;
    }

    public State state() {
        return state;
    }

    public boolean succeed() {
        return state == State.SUCCEED;
    }


    public String output() {
        return output;
    }
}