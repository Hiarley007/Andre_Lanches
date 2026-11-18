import type { ImageSourcePropType } from 'react-native';

// ─────────────────────────────────────────────
// Imagens
// ─────────────────────────────────────────────

/** Logo do app. */
export const LOGO: ImageSourcePropType = require('../../assets/imagens/logo.png');

/**
 * Imagens dos produtos, que acompanham o app (pasta assets/imagens).
 * A chave é o slug do produto.
 *
 * O Metro exige caminhos literais dentro de `require`, então cada imagem
 * precisa ser listada aqui (não dá para montar o caminho com o slug).
 */
const IMAGENS: Readonly<Record<string, ImageSourcePropType>> = {
  'x-salada': require('../../assets/imagens/x-salada.png'),
  cheddar: require('../../assets/imagens/cheddar.png'),
  'x-burguer': require('../../assets/imagens/x-burguer.png'),
  'big-tower': require('../../assets/imagens/big-tower.png'),
  'x-frango': require('../../assets/imagens/x-frango.png'),
  'batata-frita': require('../../assets/imagens/batata-frita.png'),
  nuggets: require('../../assets/imagens/nuggets.png'),
  refri: require('../../assets/imagens/refri.png'),
  sucos: require('../../assets/imagens/sucos.png'),
  // Atenção: este é o único arquivo .jpg, e o nome não é igual ao slug.
  combo: require('../../assets/imagens/combo-x-salada-batata.jpg'),
};

// ─────────────────────────────────────────────
// Funções
// ─────────────────────────────────────────────

/**
 * Devolve a imagem do produto pelo slug.
 * Retorna `null` quando não há imagem: o componente mostra um ícone no lugar.
 */
export function imagemDoProduto(slug: string): ImageSourcePropType | null {
  return IMAGENS[slug] ?? null;
}