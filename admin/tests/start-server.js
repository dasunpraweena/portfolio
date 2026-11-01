import { createServer } from 'vite';
export default async function startServer() {
  const server = await createServer({ server: { host: 'localhost', port: 5174, strictPort: true, open: false } });
  await server.listen();
  return async () => { await server.close(); };
}
