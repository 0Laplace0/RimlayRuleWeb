import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/hero.png';
import ProfileModal from './ProfileModal';

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = [
    { name: 'กฎประเทศ', href: '/rules' },
    { name: 'BackOffice', href: '/backoffice' },
    { name: 'Profile', isModal: true },
  ];

  return (
    <div className="w-full">
      <nav className="w-full">
        <div className="w-full bg-[#0b0b0d] border-b border-purple-950/60 flex items-center justify-between px-8 py-4 shadow-2xl">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Rimlay Logo" 
              className="h-12 w-auto object-contain cursor-pointer" 
            />
          </Link>

          {/* MENU & LOGIN BUTTON */}
          <div className="flex items-center space-x-8 text-sm font-medium text-gray-300">
            {navLinks.map((link) => (
              link.isModal ? (
                <button
                  key={link.name}
                  onClick={() => setIsProfileOpen(true)}
                  className="hover:text-purple-400 transition-colors duration-200 cursor-pointer"
                >
                  {link.name}
                </button>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="hover:text-purple-400 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              )
            ))}
            
            <Link 
              to="/login" 
              className="px-5 py-1.5 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white hover:shadow-lg hover:shadow-purple-900/50 transition-all duration-300 font-semibold"
            >
              เข้าสู่ระบบ
            </Link>
          </div>

        </div>
      </nav>

      {/* Popup Profile */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
};

export default Navbar;