// ======================================================
// TOKENS DE DESIGN — ANDRÉ LANCHES
// ======================================================

// Tipos utilizados nos estilos do React Native.
import type { TextStyle, ViewStyle } from 'react-native';
import type { Esquema } from '../domain/tipos.ts';

// ======================================================
// PALETA DE CORES
// ======================================================

// Estrutura das cores utilizadas pelo aplicativo.
export interface Paleta {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textoSuave: string;
  borda: string;
  onPrimary: string;
  erro: string;
  selecionado: string;
  destaque: string;
}

// O TypeScript exige as duas paletas com todas as cores.
export const cores: Record<Esquema, Paleta> = {
  // Tema claro.
  claro: {
    primary: '#E50021',
    background: '#FFE18C',
    surface: '#FFFFFF',
    text: '#2B2B2B',
    textoSuave: 'rgba(43, 43, 43, 0.6)',
    borda: 'rgba(43, 43, 43, 0.3)',
    onPrimary: '#FFFFFF',
    erro: '#C2001C',
    selecionado: '#FFF4F5',
    destaque: '#FFE18C',
  },

  // Tema escuro.
  escuro: {
    primary: '#F2354F',
    background: '#1C1917',
    surface: '#2A2622',
    text: '#F4EFE8',
    textoSuave: 'rgba(244, 239, 232, 0.65)',
    borda: 'rgba(244, 239, 232, 0.28)',
    onPrimary: '#FFFFFF',
    erro: '#FF6B7D',
    selecionado: '#3B2025',
    destaque: '#FFE18C',
  },
};

// ======================================================
// ESPAÇAMENTOS
// ======================================================

export const espacos = {
  p: 8,
  m: 16,
  g: 24,
  gg: 32,
};

// ======================================================
// BORDAS E ARREDONDAMENTOS
// ======================================================

export const raios = {
  card: 12,
  pilula: 999,
};

// ======================================================
// TIPOGRAFIA
// ======================================================

// O satisfies confere os estilos sem perder os valores
// específicos de cada propriedade.
export const tipografia = {
  titulo: {
    fontSize: 24,
    fontWeight: '700',
  },
  secao: {
    fontSize: 18,
    fontWeight: '700',
  },
  nome: {
    fontSize: 16,
    fontWeight: '400',
  },
  descricao: {
    fontSize: 14,
    fontWeight: '400',
  },
  preco: {
    fontSize: 16,
    fontWeight: '700',
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
  },
  erro: {
    fontSize: 13,
    fontWeight: '400',
  },
} satisfies Record<string, TextStyle>;

// ======================================================
// SOMBRAS
// ======================================================

// iOS utiliza shadow* e Android utiliza elevation.
export const sombra = {
  shadowColor: '#000000',
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  elevation: 3,
} satisfies ViewStyle;
