import { NavLink } from 'react-router-dom';
import { Grid3X3, PlusSquare, BarChart3, Heart, Bell } from 'lucide-react';
import { useState } from 'react';
import AddCardModal from './AddCardModal';

export default function BottomNav() {
    const [addModalOpen, setAddModalOpen] = useState(false);

    const navItems = [
        { to: '/', icon: Grid3X3, label: 'Gallery' },
        { to: '/stats', icon: BarChart3, label: 'Stats' },
        { to: '/alerts', icon: Bell, label: 'Alerts' },
        { to: '/wishlist', icon: Heart, label: 'Wishlist' },
    ];

    return (
        <>
            <nav className="nav-bottom md:hidden">
                {navItems.slice(0, 2).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon className="w-6 h-6" />
                    </NavLink>
                ))}

                {/* Add button in center */}
                <button
                    onClick={() => setAddModalOpen(true)}
                    className="nav-item"
                    aria-label="Add card"
                >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-ig-gradient-start via-ig-gradient-middle to-ig-gradient-end flex items-center justify-center">
                        <PlusSquare className="w-6 h-6 text-white" />
                    </div>
                </button>

                {navItems.slice(2).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon className="w-6 h-6" />
                    </NavLink>
                ))}
            </nav>

            {/* Floating action button for desktop */}
            <button
                onClick={() => setAddModalOpen(true)}
                className="fab hidden md:flex bottom-6 right-6"
                aria-label="Add card"
            >
                <PlusSquare className="w-6 h-6" />
            </button>

            {/* Add card modal */}
            <AddCardModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
            />
        </>
    );
}
