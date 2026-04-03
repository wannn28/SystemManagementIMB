import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';

interface FinanceCategoryComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  inputClassName?: string;
}

export const FinanceCategoryCombobox: React.FC<FinanceCategoryComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder,
  inputClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [internal, setInternal] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = (internal || '').trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.toLowerCase().includes(q));
  }, [internal, options]);

  const updateMenuPos = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPos();
  }, [open, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updateMenuPos();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const commit = (v: string) => {
    setInternal(v);
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          value={internal}
          onChange={e => {
            const v = e.target.value;
            setInternal(v);
            onChange(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`${inputClassName} pr-9`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-expanded={open}
          aria-label="Buka daftar kategori"
          onClick={() => setOpen(o => !o)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <FiChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open &&
        filtered.length > 0 &&
        menuPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <ul
            ref={listRef}
            className="fixed z-[100] max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width, minWidth: 200 }}
            role="listbox"
          >
            {filtered.map((name, idx) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(-1)}
                  onClick={() => commit(name)}
                  className={`w-full px-3 py-2 text-left text-sm text-gray-800 transition-colors ${
                    hoverIndex === idx ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'
                  }`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
};
