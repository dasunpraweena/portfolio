import { useEffect, useReducer, useRef, useState } from 'react';

export function useApiResource(load, dependencies = []) {
  const [attempt, retry] = useReducer(value => value + 1, 0);
  const requestKey = JSON.stringify([...dependencies, attempt]);
  const [state, setState] = useState({ status: 'loading', data: null, error: null, requestKey });
  const loader = useRef(load);
  loader.current = load;
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null, requestKey });
    Promise.resolve().then(() => loader.current(controller.signal)).then(data => {
      if (!controller.signal.aborted) setState({ status: 'success', data, error: null, requestKey });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ status: 'error', data: null, error, requestKey });
    });
    return () => controller.abort();
  }, [requestKey]);
  return { ...(state.requestKey === requestKey ? state : { status: 'loading', data: null, error: null }), retry };
}
