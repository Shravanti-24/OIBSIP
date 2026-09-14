import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-crust-50 px-4 text-center">
      <h1 className="text-3xl font-bold text-ink-900">404 - Page not found</h1>
      <p className="text-ink-900/70">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/">
        <Button className="w-auto px-6">Back to home</Button>
      </Link>
    </div>
  );
}
