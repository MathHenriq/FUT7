export interface FlowOption {
  key: string;
  label: string;
  selected: boolean;
  warn?: boolean;
  dot?: string;
  onClick: () => void;
}

export function StepGrid({ items }: { items: FlowOption[] }) {
  return (
    <div className="opt-grid2">
      {items.map((item) => (
        <div
          key={item.key}
          onClick={item.onClick}
          className={`opt-chip${item.selected ? ' selected' : ''}${item.selected && item.warn ? ' warn' : ''}`}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function StepList({ items }: { items: FlowOption[] }) {
  return (
    <div className="opt-list">
      {items.map((item) => (
        <div
          key={item.key}
          onClick={item.onClick}
          className={`opt-list-item${item.selected ? ' selected' : ''}${item.selected && item.warn ? ' warn' : ''}`}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function StepCardColor({ items }: { items: FlowOption[] }) {
  return (
    <div className="opt-cardcolor-grid">
      {items.map((item) => (
        <div
          key={item.key}
          onClick={item.onClick}
          className={`opt-cardcolor-chip${item.selected ? ' selected' : ''}`}
        >
          <div className="opt-cardcolor-dot" style={{ background: item.dot }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}
