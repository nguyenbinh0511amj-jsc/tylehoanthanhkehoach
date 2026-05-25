'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Xem dữ liệu', icon: '📊' },
    { href: '/import', label: 'Import Excel', icon: '📥' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">📋</span>
        <span className="navbar-title">Kế Hoạch Kiểm Tra</span>
      </div>
      <div className="navbar-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
          >
            <span className="navbar-link-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
