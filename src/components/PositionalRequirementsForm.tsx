import React, { useState } from 'react';
import { PositionCode, PositionalRequirement } from '../types';

interface PositionalRequirementsFormProps {
  positionCode: PositionCode;
  positionLabel: string;
  requirement: PositionalRequirement;
  onChangeRequirement: (updated: PositionalRequirement) => void;
  onTriggerToast: (msg: string) => void;
  onResetDefault: () => void;
}

interface CategoryConfig {
  key: 'physicalTags' | 'tacticalTags' | 'technicalTags' | 'psychologicalTags';
  title: string;
  icon: string;
  colorTheme: {
    text: string;
    badge: string;
    border: string;
  };
  suggestions: string[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'physicalTags',
    title: 'Perfil Físico',
    icon: 'fitness_center',
    colorTheme: {
      text: 'text-[#ffb74d]',
      badge: 'bg-[#ffb74d]/10 text-[#ffb74d] border-[#ffb74d]/30',
      border: 'focus:border-[#ffb74d]',
    },
    suggestions: [
      'Velocidade de Ponta',
      'Aceleração 0-10m',
      'Resistência Aeróbica (Caixa)',
      'Força no Duelo / Contacto',
      'Estatura / Jogo Aéreo',
      'Impulsão Vertical',
      'Agilidade Lateral',
      'Recuperação Rápida',
    ],
  },
  {
    key: 'tacticalTags',
    title: 'Perfil Tático',
    icon: 'strategy',
    colorTheme: {
      text: 'text-[#8abfe4]',
      badge: 'bg-[#8abfe4]/10 text-[#8abfe4] border-[#8abfe4]/30',
      border: 'focus:border-[#8abfe4]',
    },
    suggestions: [
      'Leitura de Jogo 360º',
      'Posicionamento Defensivo',
      'Pressão Alta no Portador',
      'Ataque à Profundidade',
      'Movimento entre Linhas',
      'Balanço Defensivo',
      'Apoio ao Colega / Pivot',
      'Fecho de Espaços Interiores',
    ],
  },
  {
    key: 'technicalTags',
    title: 'Perfil Técnico',
    icon: 'sports_soccer',
    colorTheme: {
      text: 'text-[#ff535b]',
      badge: 'bg-[#ff535b]/10 text-[#ffb3b1] border-[#ff535b]/30',
      border: 'focus:border-[#ff535b]',
    },
    suggestions: [
      'Passe Curto & Longo',
      'Primeiro Toque Orientado',
      'Cruzamento em Andamento',
      'Dribling 1v1',
      'Finalização a 1-2 Toques',
      'Desarme Limpo & Corte',
      'Condução de Bola Vertiginosa',
      'Remate de Meia Distância',
    ],
  },
  {
    key: 'psychologicalTags',
    title: 'Perfil Psicológico',
    icon: 'psychology',
    colorTheme: {
      text: 'text-[#81c784]',
      badge: 'bg-[#81c784]/10 text-[#81c784] border-[#81c784]/30',
      border: 'focus:border-[#81c784]',
    },
    suggestions: [
      'Liderança & Comunicação',
      'Concentração 90 Minutos',
      'Agressividade Positiva',
      'Resiliência sob Pressão',
      'Confiança no Duelo',
      'Disciplina Tática Inegociável',
      'Tomada de Risco Consciente',
      'Espírito Colectivo / Sacrifício',
    ],
  },
];

export const PositionalRequirementsForm: React.FC<PositionalRequirementsFormProps> = ({
  positionCode,
  positionLabel,
  requirement,
  onChangeRequirement,
  onTriggerToast,
  onResetDefault,
}) => {
  const [inputStates, setInputStates] = useState<Record<string, string>>({
    physicalTags: '',
    tacticalTags: '',
    technicalTags: '',
    psychologicalTags: '',
  });

  const handleAddTag = (
    categoryKey: 'physicalTags' | 'tacticalTags' | 'technicalTags' | 'psychologicalTags',
    tagValue: string
  ) => {
    const trimmed = tagValue.trim();
    if (!trimmed) return;

    const currentTags = requirement[categoryKey] || [];
    if (currentTags.includes(trimmed)) {
      onTriggerToast(`Etiqueta "${trimmed}" já existe nesta categoria.`);
      return;
    }

    onChangeRequirement({
      ...requirement,
      [categoryKey]: [...currentTags, trimmed],
    });

    setInputStates((prev) => ({ ...prev, [categoryKey]: '' }));
  };

  const handleRemoveTag = (
    categoryKey: 'physicalTags' | 'tacticalTags' | 'technicalTags' | 'psychologicalTags',
    tagToRemove: string
  ) => {
    const currentTags = requirement[categoryKey] || [];
    onChangeRequirement({
      ...requirement,
      [categoryKey]: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  const handleDirectivesChange = (val: string) => {
    onChangeRequirement({
      ...requirement,
      boardDirectives: val,
    });
  };

  const handleSave = () => {
    onTriggerToast(`Requisitos posicionais de ${positionLabel} (${positionCode}) guardados com sucesso!`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Form Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#353436] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b] font-mono-data font-extrabold text-sm shrink-0">
            {positionCode}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#e5e2e3]">
                Matriz de Requisitos — {positionLabel}
              </h3>
              <span className="text-[10px] font-bold font-mono-data bg-[#ff535b]/20 text-[#ffb3b1] px-2 py-0.5 rounded border border-[#ff535b]/40">
                MODELO TÁTICO
              </span>
            </div>
            <p className="text-xs text-[#e4bebc] mt-0.5">
              Defina os atributos exigidos e o perfil ideal para prospecção de mercado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onResetDefault}
            className="bg-[#26262B] hover:bg-[#353436] text-[#e4bebc] hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-[#353436] flex items-center gap-1.5 cursor-pointer"
            title="Restaurar valores predefinidos do clube"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Restaurar Predefinição</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="bg-[#ff535b] hover:brightness-110 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>Guardar Requisitos</span>
          </button>
        </div>
      </div>

      {/* Grid of 4 Profile Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CATEGORIES.map((cat) => {
          const tags = requirement[cat.key] || [];
          const inputValue = inputStates[cat.key] || '';

          return (
            <div
              key={cat.key}
              className="bg-[#141416] border border-[#353436] hover:border-[#5b403f] rounded-2xl p-4 flex flex-col gap-3 transition-all shadow-md"
            >
              {/* Category Title Header */}
              <div className="flex items-center justify-between border-b border-[#26262B] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-xl ${cat.colorTheme.text}`}>
                    {cat.icon}
                  </span>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#e5e2e3]">
                    {cat.title}
                  </h4>
                </div>
                <span className="text-[10px] font-mono-data font-bold text-[#e4bebc] bg-[#1c1b1c] px-2 py-0.5 rounded border border-[#353436]">
                  {tags.length} {tags.length === 1 ? 'atributo' : 'atributos'}
                </span>
              </div>

              {/* Active Tags / Etiquetas list */}
              <div className="flex flex-wrap gap-2 min-h-[42px] items-center p-2 bg-[#1c1b1c]/80 rounded-xl border border-[#26262B]">
                {tags.length === 0 ? (
                  <span className="text-xs text-[#e4bebc]/40 italic px-1">
                    Nenhum atributo definido. Escreva abaixo ou escolha nas sugestões.
                  </span>
                ) : (
                  tags.map((t) => (
                    <span
                      key={t}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${cat.colorTheme.badge}`}
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(cat.key, t)}
                        className="hover:text-white text-[11px] font-extrabold ml-0.5 cursor-pointer"
                        title="Remover"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Custom Tag Input */}
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) =>
                    setInputStates((prev) => ({ ...prev, [cat.key]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(cat.key, inputValue);
                    }
                  }}
                  placeholder={`Adicionar atributo a ${cat.title}...`}
                  className="flex-1 bg-[#1c1b1c] border border-[#353436] focus:border-[#ff535b] text-xs text-[#e5e2e3] rounded-xl px-3 py-2 outline-none transition-colors placeholder:text-[#e4bebc]/40"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(cat.key, inputValue)}
                  className="bg-[#26262B] hover:bg-[#ff535b] text-[#e5e2e3] hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-[#353436] hover:border-[#ff535b] flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Inserir</span>
                </button>
              </div>

              {/* Quick Suggestion Chips */}
              {cat.suggestions && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#26262B]">
                  <span className="text-[10px] font-bold text-[#e4bebc]/60 uppercase tracking-wider mr-1">
                    Sugestões:
                  </span>
                  {cat.suggestions
                    .filter((s) => !tags.includes(s))
                    .slice(0, 5)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddTag(cat.key, s)}
                        className="bg-[#1c1b1c] hover:bg-[#26262B] hover:text-[#ffb3b1] text-[#e4bebc] text-[10px] font-mono-data px-2 py-0.5 rounded-md border border-[#353436] transition-all cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Free Text Area: Diretrizes da Direção / Modelo de Jogo */}
      <div className="bg-[#1c1b1c] border border-[#353436] rounded-2xl p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#353436] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ba68c8] text-xl">menu_book</span>
            <div>
              <h4 className="font-extrabold text-sm text-[#e5e2e3]">
                Diretrizes da Direção / Modelo de Jogo
              </h4>
              <p className="text-xs text-[#e4bebc]">
                Orientação estratégica, exigências metodológicas e princípios inegociáveis para esta posição.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold font-mono-data bg-[#ba68c8]/20 text-[#e1bee7] px-2.5 py-1 rounded-md border border-[#ba68c8]/40">
            TEXTO LIVRE
          </span>
        </div>

        <textarea
          value={requirement.boardDirectives || ''}
          onChange={(e) => handleDirectivesChange(e.target.value)}
          placeholder="Insira aqui as diretrizes estratégicas da direção e do departamento de scouting para a posição selecionada (ex: perfil etário, modelo de negócios, versatilidade tática exigida)..."
          rows={5}
          className="w-full bg-[#141416] border border-[#353436] focus:border-[#ba68c8] text-xs text-[#e5e2e3] rounded-xl p-3.5 outline-none transition-colors leading-relaxed placeholder:text-[#e4bebc]/40"
        />

        <div className="flex items-center justify-between text-[11px] text-[#e4bebc] font-mono-data pt-1">
          <span>💡 As alterações são guardadas automaticamente no rascunho de prospecção.</span>
          <span>{requirement.boardDirectives?.length || 0} caracteres</span>
        </div>
      </div>
    </div>
  );
};
