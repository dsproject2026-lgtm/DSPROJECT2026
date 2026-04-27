import { useLocation, useNavigate } from 'react-router-dom';

type CommissionSegment = 'eleicoes' | 'candidatos' | 'estudantes';

type SegmentConfig = {
  registerPath: string;
  viewPath: string;
};

const SEGMENT_CONFIG: Record<CommissionSegment, SegmentConfig> = {
  eleicoes: {
    registerPath: '/comissao/eleicoes/registrar',
    viewPath: '/comissao/eleicoes/visualizar',
  },
  candidatos: {
    registerPath: '/comissao/candidatos/registrar',
    viewPath: '/comissao/candidatos/visualizar',
  },
  estudantes: {
    registerPath: '/comissao/estudantes/registrar',
    viewPath: '/comissao/estudantes/visualizar',
  },
};

interface CommissionSegmentTabsProps {
  segment: CommissionSegment;
}

export function CommissionSegmentTabs({ segment }: CommissionSegmentTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = SEGMENT_CONFIG[segment];

  const activePath = location.pathname.startsWith(config.registerPath)
    ? config.registerPath
    : config.viewPath;

  const tabs = [
    { label: 'Registar', path: config.registerPath },
    { label: 'Visualizar', path: config.viewPath },
  ];

  return (
    <div className="inline-flex rounded-xl bg-[#ececec] p-1">
      {tabs.map((tab) => {
        const isActive = activePath === tab.path;
        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => navigate(tab.path)}
            className={`text-ui-sm min-w-[128px] rounded-lg px-4 py-2 font-semibold transition ${
              isActive
                ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                : 'text-[#4b5563] hover:bg-[#f5f5f5]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
