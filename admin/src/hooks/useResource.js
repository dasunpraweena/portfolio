import { useCallback, useEffect, useRef, useState } from 'react';
export function useResource(loader, dependencies = []) {
  const ref = useRef(loader); ref.current = loader;
  const active = useRef(null);
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const reload = useCallback(async () => {
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    setState(previous => ({ ...previous, status: 'loading', error: null }));
    try { const data = await ref.current(controller.signal); if (!controller.signal.aborted) setState({ data, status: 'success', error: null }); return data; }
    catch (error) { if (!controller.signal.aborted) setState(previous => ({ ...previous, status: 'error', error })); return null; }
  }, []);
  useEffect(() => { reload(); return () => active.current?.abort(); }, [reload, ...dependencies]);
  return { ...state, reload };
}
