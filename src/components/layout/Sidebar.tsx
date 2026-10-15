import React from 'react';
import { Crosshair, BarChart3, Search, User } from 'lucide-react';

export type PageId = 'opponent' | 'match' | 'evidence' | 'player';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems: {
  id: PageId;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'opponent',
    label: 'Opponent Report',
    subtitle: 'Before the match',
    icon: <Crosshair size={22} />,
  },
  {
    id: 'match',
    label: 'Match & Q\u0026A',
    subtitle: 'During & after',
    icon: <BarChart3 size={22} />,
  },
  {
    id: 'evidence',
    label: 'Evidence View',
    subtitle: 'Verify any insight',
    icon: <Search size={22} />,
  },
  {
    id: 'player',
    label: 'Player Drill-down',
    subtitle: 'Movement & zones',
    icon: <User size={22} />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
}) => {
  return (
    <aside className="sidebar">
      <div style={{ padding: 'var(--space-6)' }}>
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 'var(--space-2) 0',
            marginBottom: 'var(--space-6)',
          }}
        >
          <img
            src="/KORAA_Logo.png"
            alt="KORAA Logo"
            style={{
              width: '165px',
              height: 'auto',
              maxHeight: '165px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto var(--space-2) auto',
            }}
          />

          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--off-white)',
                letterSpacing: '0.02em',
                lineHeight: 1.1,
              }}
            >
              Pep Telligence
            </div>

            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--tactical-lime)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              Tactical Intelligence
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 var(--space-4)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Navigation
          </div>

          {navItems.map((item) => {
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <div
                  className="nav-item__icon"
                  style={{
                    color: isActive
                      ? 'var(--tactical-lime)'
                      : undefined,
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <div
                    className="nav-item__label"
                    style={{
                      color: isActive
                        ? 'var(--off-white)'
                        : undefined,
                      fontWeight: isActive ? 700 : undefined,
                    }}
                  >
                    {item.label}
                  </div>

                  <div className="nav-item__subtitle">
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 'var(--space-5) var(--space-6)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div
          className="demo-notice"
          style={{
            width: '100%',
            justifyContent: 'center',
          }}
        >
          ⚽ Demo — Al Ahly vs Zamalek U19
        </div>
      </div>
    </aside>
  );
};