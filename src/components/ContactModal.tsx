import React, { useEffect } from 'react';
import { Contact, Player } from '../types';
import { Avatar } from './Avatar';

interface ContactModalProps {
  contact: Contact | null;
  onClose: () => void;
  players?: Player[];
  onPlayerClick?: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  contact,
  onClose,
  players = [],
  onPlayerClick,
  onTriggerToast,
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    if (!contact) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contact, onClose]);

  if (!contact) return null;

  // Represented players lookup
  const representedPlayers = players.filter(
    (p) =>
      (contact.representedPlayerIds && contact.representedPlayerIds.includes(p.id)) ||
      (p.agent && p.agent.toLowerCase().includes(contact.name.toLowerCase()))
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onTriggerToast(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Centered Modal Card */}
      <div className="relative z-10 bg-[#1c1b1c] border border-[#353436] w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#353436] pb-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={contact.name} className="w-14 h-14 text-sm border border-[#0b4e6e] shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-[#e5e2e3] tracking-tight">{contact.name}</h3>
                <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded uppercase bg-[#0b4e6e]/40 text-[#8abfe4] border border-[#0b4e6e]">
                  {contact.contactType}
                </span>
              </div>
              <span className="text-xs text-[#e4bebc] mt-0.5">
                {contact.role} — <strong className="text-white font-semibold">{contact.organization}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#26262B] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white flex items-center justify-center transition-colors cursor-pointer font-bold text-sm shrink-0"
            title="Fechar (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Contact Quick Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contact.email && (
            <div className="p-3 bg-[#141416] border border-[#26262B] rounded-xl flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">Email Profissional</span>
              <div className="flex items-center justify-between gap-1 min-w-0">
                <a
                  href={`mailto:${contact.email}`}
                  className="text-xs text-[#8abfe4] hover:underline font-mono-data truncate"
                >
                  {contact.email}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(contact.email!, 'Email')}
                  className="p-1 text-[#e4bebc] hover:text-white shrink-0"
                  title="Copiar Email"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              </div>
            </div>
          )}

          {contact.phone && (
            <div className="p-3 bg-[#141416] border border-[#26262B] rounded-xl flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">Telefone / WhatsApp</span>
              <div className="flex items-center justify-between gap-1 min-w-0">
                <a
                  href={`tel:${contact.phone}`}
                  className="text-xs text-[#e5e2e3] font-mono-data truncate hover:text-[#8abfe4]"
                >
                  {contact.phone}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(contact.phone!, 'Telefone')}
                  className="p-1 text-[#e4bebc] hover:text-white shrink-0"
                  title="Copiar Telefone"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              </div>
            </div>
          )}

          {contact.country && (
            <div className="p-3 bg-[#141416] border border-[#26262B] rounded-xl flex flex-col gap-1 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">País / Mercado</span>
              <span className="text-xs text-[#e5e2e3] font-semibold">{contact.country}</span>
            </div>
          )}
        </div>

        {/* Notes & Observations */}
        {contact.notes && (
          <div className="flex flex-col gap-1.5 p-3.5 bg-[#141416] border border-[#26262B] rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffb3b1] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              <span>Notas & Observações do Clube</span>
            </span>
            <p className="text-xs text-[#e4bebc] leading-relaxed italic">"{contact.notes}"</p>
          </div>
        )}

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono-data px-2 py-0.5 rounded-lg bg-[#26262B] text-[#e4bebc] border border-[#353436]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Represented Players Section */}
        {representedPlayers.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[#353436]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ffb3b1] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">sports_soccer</span>
              <span>Atletas Representados ({representedPlayers.length})</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {representedPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onPlayerClick) onPlayerClick(p);
                  }}
                  className="flex items-center gap-2 p-2 bg-[#141416] border border-[#26262B] hover:border-[#ff535b] rounded-xl text-left transition-all cursor-pointer group"
                >
                  <Avatar name={p.name} className="w-8 h-8 text-xs shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#e5e2e3] group-hover:text-[#ffb3b1] truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-[#e4bebc]/70">
                      {p.position} • {p.club}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#353436]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#ff535b] hover:brightness-110 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
