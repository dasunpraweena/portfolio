import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './auth/AuthProvider';
import Layout from './components/Layout';
import Login, { AccessState } from './pages/Login';
import { resources } from './data/resources';
import { State } from './components/Shared';
const Overview = lazy(() => import('./pages/Overview'));
const ResourcePage = lazy(() => import('./pages/ResourcePage'));
const SingletonPage = lazy(() => import('./pages/SingletonPage'));
const Messages = lazy(() => import('./pages/Messages'));
const Assets = lazy(() => import('./pages/Assets'));
const CvPage = lazy(() => import('./pages/CvPage'));
export default function App() {
  const { access } = useAuth();
  if (access.status === 'signedOut') return <Login />;
  if (access.status !== 'authorized') return <AccessState />;
  return <Suspense fallback={<State status="loading" />}><Routes><Route element={<Layout />}><Route index element={<Navigate to="/overview" replace />} /><Route path="overview" element={<Overview />} />{Object.keys(resources).map(resource => <Route path={resource} key={resource} element={resources[resource].singleton ? <SingletonPage key={resource} resource={resource} /> : <ResourcePage key={resource} resource={resource} />} />)}<Route path="messages" element={<Messages />} /><Route path="cv" element={<CvPage />} /><Route path="assets" element={<Assets />} /><Route path="*" element={<section className="admin-card"><State title="This workspace page does not exist." /></section>} /></Route></Routes></Suspense>;
}
