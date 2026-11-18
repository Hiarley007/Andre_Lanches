
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LOGO } from '../lib/imagem';
import { ABAS } from '../domain/navegacao';
import { espacos, raios, sombra, tipografia, type Paleta } from '../theme';
import { useEstilos } from '../context/TemaContext';
import type { IdAba } from '../domain/tipos';

interface Props {
  aba: IdAba | null;
  onNavegar: (aba: IdAba) => void;
  quantidade: number;
  onCarrinho: () => void;
  onConfig: () => void;
}

export default function Header({
  aba,
  onNavegar,
  quantidade,
  onCarrinho,
  onConfig,
}: Props) {
  const { s, cores } = useEstilos(criarEstilos);
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top + espacos.p }]}>
      {/* Identidade visual e ações */}
      <View style={s.marca}>
        <View style={s.identidade}>
          <View style={s.logo}>
            <Image
              source={LOGO}
              style={s.logoImagem}
              resizeMode="contain"
            />
          </View>

          <Text style={s.nome}>André Lanches</Text>
        </View>

        <View style={s.acoes}>
          <Pressable
            style={s.icone}
            onPress={onConfig}
            accessibilityRole="button"
            accessibilityLabel="Configurações"
          >
            <Ionicons
              name="settings-outline"
              size={23}
              color={cores.onPrimary}
            />
          </Pressable>

          <Pressable
            style={s.icone}
            onPress={onCarrinho}
            accessibilityRole="button"
            accessibilityLabel={`Seu pedido, ${quantidade} itens`}
          >
            <Ionicons
              name="cart-outline"
              size={26}
              color={cores.onPrimary}
            />

            {quantidade > 0 ? (
              <View style={s.selo}>
                <Text style={s.seloTexto}>{quantidade}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Navegação */}
      <View style={s.abas}>
        {ABAS.map((item) => {
          const ativa = item.id === aba;

          return (
            <Pressable
              key={item.id}
              style={[s.aba, ativa && s.abaAtiva]}
              onPress={() => onNavegar(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
            >
              <Text style={[s.abaTexto, ativa && s.abaTextoAtivo]}>
                {item.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.primary,
      paddingHorizontal: espacos.m,
      paddingBottom: espacos.m,
    },

    marca: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 54,
      marginBottom: espacos.p,
    },

    identidade: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    logo: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },

    logoImagem: {
      width: 38,
      height: 38,
    },

    nome: {
      ...tipografia.titulo,
      color: c.onPrimary,
      marginLeft: espacos.p,
      fontWeight: '700',
    },

    acoes: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    icone: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },

    selo: {
      position: 'absolute',
      top: 4,
      right: 2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: c.destaque,
      alignItems: 'center',
      justifyContent: 'center',
    },

    seloTexto: {
      fontSize: 11,
      fontWeight: '700',
      color: '#E50021',
    },

    abas: {
      flexDirection: 'row',
      height: 52,
      padding: 4,
      borderRadius: raios.card,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },

    aba: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },

    abaAtiva: {
      backgroundColor: c.surface,
      ...sombra,
    },

    abaTexto: {
      ...tipografia.rotulo,
      color: c.onPrimary,
    },

    abaTextoAtivo: {
      color: c.primary,
    },
  });
