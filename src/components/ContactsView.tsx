import React, { useState, useMemo, useEffect } from 'react';
import { Contact, ContactType, Player } from '../types';
import { fetchContactsFromDb, saveContactToDb, deleteContactFromDb } from '../lib/supabase';
import { StarRating } from './StarRating';
import { Avatar } from './Avatar';

interface ContactsViewProps {
  players?: Player[];
  onPlayerClick?: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
}


const CONTACT_TYPES: ContactType[] = [
  'Agente',
  'Diretor Desportivo',
  'Scout',
  'Treinador',
  'Intermediário',
  'Outro',
];

const getContactTypeBadgeConfig = (type: ContactType) => {
  switch (type) {
    case 'Agente':
      return {
        style: 'bg-[#ff535b]/20 text-[#ffb3b1] border-[#ff535b]/40',
        icon: 'handshake',
      };
    case 'Diretor Desportivo':
      return {
        style: 'bg-[#0b4e6e]/40 text-[#8abfe4] border-[#0b4e6e]',
        icon: 'badge',
      };
    case 'Scout':
      return {
        style: 'bg-[#1b4332]/60 text-[#74c69d] border-[#2d6a4f]',
        icon: 'travel_explore',
      };
    case 'Treinador':
      return {
        style: 'bg-[#4a1d96]/40 text-[#c084fc] border-[#6b21a8]',
        icon: 'sports',
      };
    case 'Intermediário':
      return {
        style: 'bg-[#78350f]/40 text-[#fbbf24] border-[#b45309]',
        icon: 'hub',
      };
    case 'Outro':
    default:
      return {
        style: 'bg-[#2a2a2b] text-[#e4bebc] border-[#353436]',
        icon: 'person',
      };
  }
};

export const ContactsView: React.FC<ContactsViewProps> = ({
  players = [],
  onPlayerClick,
  onTriggerToast,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [allRepresentedModalContact, setAllRepresentedModalContact] = useState<{
    contactName: string;
    players: Player[];
  } | null>(null);

  // Modal Form Inputs
  const [formName, setFormName] = useState('');
  const [formContactType, setFormContactType] = useState<ContactType>('Agente');
  const [formRole, setFormRole] = useState('');
  const [formOrganization, setFormOrganization] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formLastContact, setFormLastContact] = useState('');
  const [formTagsStr, setFormTagsStr] = useState('');
  const [formRepresentedPlayerIds, setFormRepresentedPlayerIds] = useState<string[]>([]);

  // Open Modal for New Contact
  const handleOpenNewContact = () => {
    setEditingContact(null);
    setFormName('');
    setFormContactType('Agente');
    setFormRole('');
    setFormOrganization('');
    setFormCountry('Portugal');
    setFormEmail('');
    setFormPhone('');
    setFormAvatarUrl('');
    setFormNotes('');
    setFormLastContact('');
    setFormTagsStr('#MercadoInterno');
    setFormRepresentedPlayerIds([]);
    setIsModalOpen(true);
  };

  // Open Modal for Editing
  const handleOpenEditContact = (cnt: Contact) => {
    setEditingContact(cnt);
    setFormName(cnt.name);
    setFormContactType(cnt.contactType || 'Agente');
    setFormRole(cnt.role);
    setFormOrganization(cnt.organization);
    setFormCountry(cnt.country || '');
    setFormEmail(cnt.email);
    setFormPhone(cnt.phone);
    setFormAvatarUrl(cnt.avatarUrl || '');
    setFormNotes(cnt.notes || '');
    setFormLastContact(cnt.lastContact || '');
    setFormTagsStr(cnt.tags ? cnt.tags.join(', ') : '');
    setFormRepresentedPlayerIds(cnt.representedPlayerIds || []);
    setIsModalOpen(true);
  };

  // Toggle Represented Player Selection
  const toggleRepresentedPlayer = (playerId: string) => {
    setFormRepresentedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Save Contact
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedTags = formTagsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    if (editingContact) {
      const updatedCnt: Contact = {
        ...editingContact,
        name: formName,
        contactType: formContactType,
        role: formRole || formContactType,
        organization: formOrganization || 'Independente',
        country: formCountry,
        email: formEmail,
        phone: formPhone,
        avatarUrl: formAvatarUrl || undefined,
        notes: formNotes,
        lastContact: formLastContact,
        tags: parsedTags,
        representedPlayerIds: formRepresentedPlayerIds,
      };
      saveContactToDb(updatedCnt);
      setContacts((prev) =>
        prev.map((item) => (item.id === editingContact.id ? updatedCnt : item))
      );
      onTriggerToast(`Contacto "${formName}" atualizado com sucesso.`);
    } else {
      const newCnt: Contact = {
        id: `cnt-${Date.now()}`,
        name: formName,
        contactType: formContactType,
        role: formRole || formContactType,
        organization: formOrganization || 'Independente',
        country: formCountry || 'Portugal',
        email: formEmail,
        phone: formPhone,
        avatarUrl: formAvatarUrl || undefined,
        notes: formNotes,
        lastContact: formLastContact,
        tags: parsedTags,
        representedPlayerIds: formRepresentedPlayerIds,
      };
      saveContactToDb(newCnt);
      setContacts((prev) => [newCnt, ...prev]);
      onTriggerToast(`Novo contacto "${formName}" (${formContactType}) adicionado à rede.`);
    }

    setIsModalOpen(false);
  };

  // Delete Contact
  const handleDeleteContact = () => {
    if (!editingContact) return;
    deleteContactFromDb(editingContact.id);
    setContacts((prev) => prev.filter((item) => item.id !== editingContact.id));
    onTriggerToast(`Contacto "${editingContact.name}" removido da rede.`);
    setIsModalOpen(false);
  };

  // One-Click WhatsApp Handler
  const handleWhatsAppClick = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}`;
    window.open(url, '_blank');
    onTriggerToast(`A abrir conversa de WhatsApp com ${name}...`);
  };

  // One-Click Email Handler
  const handleEmailClick = (email: string, name: string) => {
    window.location.href = `mailto:${email}`;
    onTriggerToast(`A abrir cliente de email para ${name}...`);
  };

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((cnt) => {
      // Free Text Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = cnt.name.toLowerCase().includes(term);
        const matchesRole = cnt.role.toLowerCase().includes(term);
        const matchesOrg = cnt.organization.toLowerCase().includes(term);
        const matchesEmail = cnt.email.toLowerCase().includes(term);
        const matchesPhone = cnt.phone.toLowerCase().includes(term);
        const matchesCountry = (cnt.country || '').toLowerCase().includes(term);
        const matchesNotes = (cnt.notes || '').toLowerCase().includes(term);
        const matchesTags = (cnt.tags || []).some((t) => t.toLowerCase().includes(term));

        if (
          !matchesName &&
          !matchesRole &&
          !matchesOrg &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesCountry &&
          !matchesNotes &&
          !matchesTags
        ) {
          return false;
        }
      }

      // Dropdown Category Filter
      if (categoryFilter !== 'all') {
        if (cnt.contactType !== categoryFilter) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, searchTerm, categoryFilter]);

  // Helper to get initials
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'TB';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full min-w-0">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141416] p-6 rounded-2xl border border-[#26262B] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0b4e6e]/40 border border-[#0b4e6e] flex items-center justify-center shadow-[0_0_15px_rgba(11,78,110,0.35)] shrink-0">
            <span className="material-symbols-outlined text-[#8abfe4] text-[24px]">
              hub
            </span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#e5e2e3]">
              Rede de Contactos & Mercado
            </h1>
            <p className="text-xs text-[#e4bebc] mt-0.5">
              Diretório centralizado de agentes, diretores desportivos, scouts, treinadores e parceiros
            </p>
          </div>
        </div>

        {/* Action Button & Counter */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-[#0e0e0f] border border-[#26262B] px-3.5 py-2 rounded-xl flex items-center gap-2">
            <span className="text-[10px] font-mono-data uppercase text-[#e4bebc]">
              Total:
            </span>
            <span className="font-mono-data font-bold text-sm text-[#8abfe4]">
              {contacts.length}
            </span>
          </div>

          <button
            onClick={handleOpenNewContact}
            className="bg-[#ff535b] hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Novo Contacto</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR & DROPDOWN CATEGORY FILTER */}
      <div className="bg-[#141416] border border-[#26262B] p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e4bebc] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, cargo, clube/agência, email, telefone..."
            className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#e5e2e3] outline-none transition-all placeholder:text-[#5b403f]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e4bebc] hover:text-[#ff535b]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Dropdown Filter for Contact Type */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-[#e4bebc] text-[20px] hidden md:inline">
            filter_alt
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-auto bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">Todos os Tipos de Contacto</option>
            {CONTACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. CONTACTS GRID */}
      {filteredContacts.length === 0 ? (
        <div className="bg-[#141416] border border-[#26262B] rounded-2xl p-12 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-[#e4bebc]">
            person_off
          </span>
          <h3 className="text-lg font-bold text-[#e5e2e3]">
            Nenhum contacto encontrado
          </h3>
          <p className="text-xs text-[#e4bebc] max-w-md mx-auto">
            Não existem contactos que correspondam aos filtros ativos. Tente pesquisar outro termo ou alterar a categoria selecionada.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
            }}
            className="mt-2 inline-flex items-center gap-2 bg-[#1C1C1F] hover:bg-[#26262B] text-[#ffb3b1] px-4 py-2 rounded-xl text-xs font-bold border border-[#353436] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Limpar Filtros</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((cnt) => {
            const badgeConfig = getContactTypeBadgeConfig(cnt.contactType);
            const representedPlayers = (cnt.representedPlayerIds || [])
              .map((id) => players.find((p) => p.id === id))
              .filter((p): p is Player => p !== undefined)
              .sort((a, b) => {
                const rA = a.rating <= 5 ? a.rating : a.rating / 4;
                const rB = b.rating <= 5 ? b.rating : b.rating / 4;
                return rB - rA;
              });

            const visiblePlayers = representedPlayers.slice(0, 2);
            const remainingCount = representedPlayers.length - 2;

            return (
              <div
                key={cnt.id}
                className="bg-[#141416] border border-[#26262B] hover:border-[#ff535b]/60 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg"
              >
                <div>
                  {/* Category Badge Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${badgeConfig.style}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {badgeConfig.icon}
                      </span>
                      <span>{cnt.contactType}</span>
                    </span>

                    {cnt.country && (
                      <span className="text-[11px] font-mono-data text-[#e4bebc] font-semibold">
                        {cnt.country}
                      </span>
                    )}

                    {/* Edit Icon */}
                    <button
                      onClick={() => handleOpenEditContact(cnt)}
                      className="p-1 rounded-lg text-[#e4bebc] hover:text-white hover:bg-[#26262B] transition-colors cursor-pointer ml-auto"
                      title="Editar Contacto"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>

                  {/* Contact Avatar & Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar
                      name={cnt.name}
                      className="w-12 h-12 text-sm border-2 border-[#353436] group-hover:border-[#ff535b] transition-colors shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-base text-[#e5e2e3] group-hover:text-[#ffb3b1] transition-colors truncate">
                        {cnt.name}
                      </h3>
                      <p className="text-xs text-[#e4bebc] font-semibold truncate">
                        {cnt.role}
                      </p>
                      <p className="text-[11px] text-[#ffb3b1] font-mono-data truncate mt-0.5">
                        {cnt.organization}
                      </p>
                    </div>
                  </div>

                  {/* Contact Details (Email & Phone) */}
                  <div className="bg-[#0e0e0f] p-3 rounded-xl border border-[#26262B] space-y-1.5 mb-3 text-xs font-mono-data">
                    <div className="flex items-center gap-2 text-[#e5e2e3] truncate">
                      <span className="material-symbols-outlined text-[16px] text-[#e4bebc]">
                        mail
                      </span>
                      <a
                        href={`mailto:${cnt.email}`}
                        className="hover:text-[#ffb3b1] transition-colors truncate"
                        title={cnt.email}
                      >
                        {cnt.email}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-[#e5e2e3] truncate">
                      <span className="material-symbols-outlined text-[16px] text-[#e4bebc]">
                        call
                      </span>
                      <a
                        href={`tel:${cnt.phone}`}
                        className="hover:text-[#ffb3b1] transition-colors truncate"
                      >
                        {cnt.phone}
                      </a>
                    </div>
                  </div>

                  {/* Notes if available */}
                  {cnt.notes && (
                    <p className="text-xs text-[#e4bebc]/80 mb-3 line-clamp-2 italic">
                      "{cnt.notes}"
                    </p>
                  )}

                  {/* Represented Players section (Limited to top 2 by rating + overflow tag) */}
                  {representedPlayers.length > 0 && (
                    <div className="border-t border-[#26262B] pt-2.5 my-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">
                        ATLETAS REPRESENTADOS:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {visiblePlayers.map((rp) => (
                          <button
                            key={rp.id}
                            type="button"
                            onClick={() => onPlayerClick?.(rp)}
                            className="flex items-center gap-1.5 p-1 bg-[#0e0e0f] border border-[#26262B] hover:border-[#ff535b] rounded-lg transition-all cursor-pointer"
                          >
                            <Avatar
                              name={rp.name}
                              className="w-5 h-5 text-[9px] shrink-0"
                            />
                            <span className="text-xs font-bold text-[#e5e2e3]">{rp.name}</span>
                            <span className="text-[10px] text-[#e4bebc] font-mono-data">
                              ({rp.position})
                            </span>
                          </button>
                        ))}

                        {remainingCount > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setAllRepresentedModalContact({
                                contactName: cnt.name,
                                players: representedPlayers,
                              })
                            }
                            className="flex items-center gap-1 px-2 py-1 bg-[#ff535b]/15 hover:bg-[#ff535b]/30 text-[#ffb3b1] border border-[#ff535b]/40 rounded-lg transition-all text-xs font-bold cursor-pointer active:scale-95"
                            title="Ver todos os atletas representados"
                          >
                            <span>+{remainingCount} Atletas</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Secondary Tags if present */}
                  {cnt.tags && cnt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {cnt.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono-data font-bold bg-[#1C1C1F] text-[#e4bebc] border border-[#353436]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  {/* CRM - Último Contacto */}
                  <div className="pt-2 my-2 border-t border-[#26262B]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc] block mb-0.5">
                      Último Contacto:
                    </span>
                    <p className="text-xs text-[#ffb3b1] italic font-medium truncate">
                      {cnt.lastContact ? cnt.lastContact : 'Sem registo recente'}
                    </p>
                  </div>

                  {/* ONE-CLICK ACTION BUTTONS */}
                  <div className="pt-2.5 border-t border-[#26262B] grid grid-cols-2 gap-2 mt-1">
                    {/* Email Action */}
                    <button
                      type="button"
                      onClick={() => handleEmailClick(cnt.email, cnt.name)}
                      className="py-2 px-3 rounded-xl bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] text-xs font-bold border border-[#353436] hover:border-[#ff535b]/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#8abfe4]">
                        mail
                      </span>
                      <span>Email</span>
                    </button>

                    {/* WhatsApp Action */}
                    <button
                      type="button"
                      onClick={() => handleWhatsAppClick(cnt.phone, cnt.name)}
                      className="py-2 px-3 rounded-xl bg-[#1b4332]/60 hover:bg-[#2d6a4f] text-[#74c69d] text-xs font-bold border border-[#2d6a4f] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        chat
                      </span>
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. CREATE / EDIT CONTACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[#141416] border border-[#353436] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative my-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff535b] text-[22px]">
                  person_add
                </span>
                <h3 className="text-xl font-extrabold text-[#e5e2e3]">
                  {editingContact ? 'Editar Contacto' : 'Novo Contacto de Mercado'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#e4bebc] hover:text-white hover:bg-[#26262B] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
              {/* Tipo de Contacto (Mandatory Field) */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  Tipo de Contacto (Categoria) *
                </label>
                <select
                  required
                  value={formContactType}
                  onChange={(e) => setFormContactType(e.target.value as ContactType)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2.5 outline-none font-bold"
                >
                  {CONTACT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Jorge Mendes, Hugo Viana..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2.5 outline-none font-medium"
                />
              </div>

              {/* Role & Organization */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#e4bebc] font-bold block mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="ex: Agente FIFA, Diretor..."
                    className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-[#e4bebc] font-bold block mb-1">
                    Organização / Agência
                  </label>
                  <input
                    type="text"
                    value={formOrganization}
                    onChange={(e) => setFormOrganization(e.target.value)}
                    placeholder="ex: Gestifute, Sporting CP..."
                    className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Country, Email & Phone */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[#e4bebc] font-bold block mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="ex: Portugal"
                    className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-[#e4bebc] font-bold block mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-mono-data"
                  />
                </div>

                <div>
                  <label className="text-[#e4bebc] font-bold block mb-1">
                    Telemóvel
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+351 910 000 000"
                    className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-mono-data"
                  />
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  URL da Fotografia (Opcional)
                </label>
                <input
                  type="url"
                  value={formAvatarUrl}
                  onChange={(e) => setFormAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-mono-data"
                />
              </div>

              {/* Represented Players (Agent Migration Feature) */}
              {players.length > 0 && (
                <div>
                  <label className="text-[#e4bebc] font-bold block mb-1">
                    Jogadores Representados na Base
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto bg-[#0e0e0f] p-2.5 rounded-xl border border-[#353436]">
                    {players.map((pl) => {
                      const isSelected = formRepresentedPlayerIds.includes(pl.id);
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => toggleRepresentedPlayer(pl.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#ff535b] text-white border-[#ff535b]'
                              : 'bg-[#1C1C1F] text-[#e4bebc] border-[#353436] hover:border-[#ff535b]/50'
                          }`}
                        >
                          <span>{pl.name}</span>
                          <span className="text-[10px] opacity-80">({pl.position})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CRM Last Contact */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  Último Contacto (CRM / Interação)
                </label>
                <input
                  type="text"
                  value={formLastContact}
                  onChange={(e) => setFormLastContact(e.target.value)}
                  placeholder="ex: 28/07 - Abordagem inicial"
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-medium italic"
                />
              </div>

              {/* Category Tags */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  Tags Adicionais (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formTagsStr}
                  onChange={(e) => setFormTagsStr(e.target.value)}
                  placeholder="ex: #MercadoInterno, #Internacional"
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-mono-data"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  Notas Adicionais
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Informações sobre contacto preferencial, reuniões prévias..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl p-3 outline-none resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#26262B] flex justify-between items-center">
                {editingContact ? (
                  <button
                    type="button"
                    onClick={handleDeleteContact}
                    className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] rounded-xl border border-[#353436] font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#ff535b] hover:brightness-110 text-white rounded-xl font-bold transition-all shadow cursor-pointer active:scale-95"
                  >
                    {editingContact ? 'Guardar Alterações' : 'Criar Contacto'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL LISTA COMPLETA DE ATLETAS REPRESENTADOS */}
      {allRepresentedModalContact && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141416] border border-[#353436] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center pb-3 border-b border-[#26262B]">
              <div>
                <h3 className="text-base font-extrabold text-[#e5e2e3]">
                  Atletas Representados
                </h3>
                <p className="text-xs text-[#e4bebc]">
                  {allRepresentedModalContact.contactName} ({allRepresentedModalContact.players.length} atletas)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllRepresentedModalContact(null)}
                className="p-1 rounded-lg text-[#e4bebc] hover:text-white hover:bg-[#26262B] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allRepresentedModalContact.players.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onPlayerClick?.(p);
                    setAllRepresentedModalContact(null);
                  }}
                  className="flex items-center justify-between p-2.5 bg-[#0e0e0f] border border-[#26262B] hover:border-[#ff535b] rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={p.name}
                      className="w-9 h-9 text-xs border border-[#353436] group-hover:border-[#ff535b] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#e5e2e3] group-hover:text-[#ffb3b1] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#e4bebc] font-mono-data">
                        {p.position} • {p.club || 'Livre'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#18181A] px-2 py-0.5 rounded-md border border-[#26262B] shrink-0">
                    <StarRating value={p.rating} size="xs" variant="single" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
