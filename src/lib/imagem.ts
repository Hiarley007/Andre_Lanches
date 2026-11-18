
import type { ImageSourcePropType } from 'react-native';

// Imagens locais: o Metro precisa de caminhos literais em cada require().
export const LOGO: ImageSourcePropType = require('../../assets/imagens/icon.png');

const IMAGENS: Readonly<Record<string, ImageSourcePropType>> = {
  'x-salada': require('../../assets/imagens/x-salada.jpg'),
  cheddar: require('../../assets/imagens/cheddar.jpg'),
  'x-burguer': require('../../assets/imagens/x-burguer.jpg'),
  'big-tower': require('../../assets/imagens/big-tower.jpg'),
  'x-frango': require('../../assets/imagens/x-frango.jpg'),
  'batata-frita': require('../../assets/imagens/batata-frita.jpg'),
  nuggets: require('../../assets/imagens/nuggets.jpg'),
  refri: require('../../assets/imagens/refri.jpg'),
  sucos: require('../../assets/imagens/sucos.jpg'),

  // A promoção inicial é o combo X-Salada + Batata.
  combo: require('../../assets/imagens/combo.png'),
};

/**
 * Retorna a imagem local correspondente ao slug do banco.
 * Produtos sem imagem continuam usando o placeholder do componente.
 */
export function imagemDoProduto(
  slug: string
): ImageSourcePropType | null {
  return IMAGENS[slug] ?? null;
}
