import { SessionDetailView } from 'src/sections/session/view';

// ----------------------------------------------------------------------

export default function SessionPage({ params }: { params: { id: string } }) {
  return <SessionDetailView id={params.id} />;
}
