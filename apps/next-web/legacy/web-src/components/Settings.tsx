import { ChevronRight } from 'lucide-react';

type SettingsItem =
  | { label: string; type: 'text'; value: string }
  | { label: string; type: 'toggle'; defaultChecked?: boolean }
  | { label: string; type: 'link'; danger?: boolean };

export default function Settings() {
  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'PROFILE',
      items: [
        { label: 'Name', type: 'text', value: 'Alex Morgan' },
        { label: 'Email', type: 'text', value: 'alex@example.com' },
      ],
    },
    {
      title: 'NOTIFICATIONS',
      items: [
        { label: 'Weekly summary', type: 'toggle', defaultChecked: true },
        { label: 'Budget alerts', type: 'toggle', defaultChecked: false },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { label: 'Biometric lock', type: 'toggle', defaultChecked: true },
        { label: 'Change PIN', type: 'link' },
      ],
    },
    {
      title: 'DATA',
      items: [
        { label: 'Cloud backup', type: 'toggle', defaultChecked: true },
        { label: 'Export all data', type: 'link' },
        { label: 'Delete all data', type: 'link', danger: true },
      ],
    },
    {
      title: 'AI SETTINGS',
      items: [
        { label: 'API key', type: 'link' },
        { label: 'What we send to AI', type: 'link' },
      ],
    },
    {
      title: 'ABOUT',
      items: [
        { label: 'Version 1.0.0', type: 'link' },
        { label: 'Licenses', type: 'link' },
        { label: 'Send feedback', type: 'link' },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-10 pb-32">
      <header className="pt-4">
        <h1 className="text-5xl font-bold tracking-tight">Settings</h1>
      </header>

      <div className="flex flex-col gap-10">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-4">
            <h3 className="text-xs font-bold tracking-[0.2em] text-black uppercase">{section.title}</h3>
            <div className="flex flex-col gap-4">
              {section.items.map((item) => {
                const toggleId = `toggle-${section.title}-${item.label}`.replace(/\s+/g, '-');
                const toggleLabelId = `${toggleId}-label`;

                if (item.type === 'text') {
                  return (
                    <div key={item.label} className="flex justify-between items-center gap-4">
                      <span className="text-lg font-medium text-gray-800">{item.label}</span>
                      <span className="text-lg font-medium text-gray-500 text-right">{item.value}</span>
                    </div>
                  );
                }

                if (item.type === 'toggle') {
                  return (
                    <div key={item.label} className="flex justify-between items-center">
                      <span id={toggleLabelId} className="text-lg font-medium text-gray-800">{item.label}</span>
                      <label htmlFor={toggleId} className="relative inline-flex items-center cursor-pointer">
                        <input
                          id={toggleId}
                          aria-labelledby={toggleLabelId}
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked={item.defaultChecked}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`flex justify-between items-center group w-full text-left rounded-xl px-0 py-1 cursor-pointer focus:outline-none focus-visible:ring-2 ${
                      item.danger
                        ? 'hover:bg-rose-50/80 focus-visible:ring-rose-500/20'
                        : 'hover:bg-gray-50/80 focus-visible:ring-black/20'
                    }`}
                  >
                    <span className={`text-lg font-medium ${item.danger ? 'text-rose-500' : 'text-gray-800'}`}>
                      {item.label}
                    </span>
                    <ChevronRight
                      size={20}
                      className={item.danger ? 'text-rose-500' : 'text-gray-300 group-hover:text-black transition-colors'}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
