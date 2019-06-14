import { Machine, State, interpret, assign } from 'xstate';

var fs = require('fs');

let lightMachine = null;

// Stateless machine definition
function initMachine(restoredContext) {
    let machine = Machine(
        {
            id: 'light',

            // Initial state
            initial: 'green',

            // Local context for entire machine
            context: {
                timesBlinked: 0
            },

            // State definitions
            states: {
                green: {
                    on: {
                        TOGGLE: 'yellow'
                    }
                },
                yellow: {
                    on: {
                       // Transient transition
                        '': {
                            target: 'red',
                            cond: {
                                type: 'blinkedFiveTimes',
                                timesToBlink: 5,
                            }
                        },
                        TOGGLE: {
                            target: 'yellow',
                            actions: 'blink',
                        }
                    }
                },
                red: {
                    type: 'final',
                    onDone: (context, event) => {
                        console.log('i am done!');
                    }
                }
            }
        },
        {
            actions: {
                blink: assign(
                    {
                        timesBlinked: (context, event) => {
                            return context.timesBlinked + 1;
                        }
                    }
                )
            },
            guards: {
                blinkedFiveTimes: (context, event, { cond }) => {
                    return context.timesBlinked == cond.timesToBlink;
                }
            }
        }
    );

    if (restoredContext) {
        machine = machine.withContext(restoredContext);
    }

    return machine;
}

export function run() {
    lightMachine = initMachine();
    const { initialState } = lightMachine;

    let pollTimeout;
    let jsonState;
    // console.log(initialState.value);
    // console.log(initialState.changed);

    var periodicExecutor = (state, interval, restore) => {
        console.log(state.value);

        if (restore) {
            var rawData = fs.readFileSync('state.json');
            const stateDefinition = JSON.parse(rawData);

            // Use State.create() to restore state from a plain object
            const restoredState = State.create(stateDefinition);

            // Use machine.resolveState() to resolve the state definition to a new State instance
            // relative to the machine
            lightMachine = initMachine(restoredState.context);
            state = lightMachine.resolveState(restoredState);
        }

        if (state.value == 'red') {
            clearTimeout(pollTimeout);
        }
        else {
            const nextState = lightMachine.transition(state, 'TOGGLE');

            jsonState = JSON.stringify(nextState);

            let fsRes = fs.writeFileSync('state.json', jsonState, 'utf8');
            pollTimeout = setTimeout(
                () => {
                    periodicExecutor(nextState, interval, true);
                },
                interval
            );
        }
    };

    try {
        periodicExecutor(initialState, 3000);
    } catch (error) {
        console.log(error);
    }
}
