import { Machine, interpret } from 'xstate';

// Stateless machine definition
// machine.transition(...) is a pure function used by the interpreter.
const lightMachine = Machine({
    id: 'light',

    // Initial state
    initial: 'green',

    // Local context for entire machine
    context: {
        elapsed: 0,
        direction: 'east'
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
                TOGGLE: 'red'
            }
        },
        red: {
            type: 'final',
            onDone: (context, event) => {
                console.log('i am done!');
            }
        }
    }
});

export function run() {
    const { initialState } = lightMachine;

    var pollTimeout;
    // console.log(initialState.value);
    // console.log(initialState.changed);

    var periodicExecutor = (state, interval) => {
        console.log(state.value);

        if (state.value == 'red') {
            clearTimeout(pollTimeout);
        }
        else {
            const nextState = lightMachine.transition(state, 'TOGGLE');

            pollTimeout = setTimeout(
                () => {
                    periodicExecutor(nextState, interval);
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


// // Machine instance with internal state
// const toggleService = interpret(toggleMachine)
//   .onTransition(state => console.log(state.value))
//   .start();
// // => 'inactive'

// toggleService.send('TOGGLE');
// // => 'active'

// toggleService.send('TOGGLE');
// // => 'inactive'
