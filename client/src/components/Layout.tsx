import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout() {
    return (
        <div className="min-h-screen bg-ig-background">
            {/* Header */}
            <Header />

            {/* Main content */}
            <main className="pb-16 pt-14">
                <Outlet />
            </main>

            {/* Bottom navigation (mobile) */}
            <BottomNav />
        </div>
    );
}
