import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import PostCard from '../../components/PostCard';

const MOCK_POSTS = [
  {
    id: '1',
    author: 'Equipe Globus Dei',
    role: 'Administração Central',
    content: 'Seja bem-vindo à nova plataforma mobile da Globus Dei! Agora você pode acompanhar todas as iniciativas e conexões diretamente do seu celular.',
    time: '2h',
    likes: 124,
    comments: 12,
  },
  {
    id: '2',
    author: 'João Missionário',
    role: 'Agente em Campo - África',
    content: 'Hoje completamos 1 ano de projeto em Angola. Muitas vidas foram transformadas e seguimos firmes no propósito de evangelização global.',
    time: '5h',
    likes: 342,
    comments: 45,
  },
  {
    id: '3',
    author: 'Maria Educadora',
    role: 'Empreendimento: Escola da Vida',
    content: 'Estamos com novas oportunidades de voluntariado para professores de ensino básico. Se você sente esse chamado, confira nossa aba de oportunidades!',
    time: '1d',
    likes: 89,
    comments: 5,
  },
  {
    id: '4',
    author: 'David Business',
    role: 'Investidor e Mentor',
    content: 'Acredito que o empreendedorismo é uma ferramenta poderosa para a missão. Como você tem usado seu negócio para influenciar positivamente?',
    time: '2d',
    likes: 210,
    comments: 18,
  },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            author={item.author}
            role={item.role}
            content={item.content}
            time={item.time}
            likes={item.likes}
            comments={item.comments}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8d472e']} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', // Light gray background common in social feeds
  },
  listContent: {
    paddingVertical: 1, // Space between top bar and first card
  },
});
