import { useEffect, useState } from 'react';
import { VStack, Text, HStack, useTheme, ScrollView, Box } from 'native-base';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { OrderFirestoreDTO } from '../DTOs/OrderFirestoreDTO';
import {
  CircleWavyCheck,
  Hourglass,
  DesktopTower,
  Clipboard,
} from 'phosphor-react-native';

import { dateFormat } from '../utils/firestoreDateFormat';

import { CardDetails } from '../components/CardDetails';
import { OrderProps } from '../components/Order';
import { Loading } from '../components/Loading';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from 'react-native';

type RouteParams = {
  orderId: string;
};

type OrderDetails = OrderProps & {
  description: string;
  solution: string;
  closed: string;
};

export function Details() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { orderId } = route.params as RouteParams;

  const [isLoading, setIsLoading] = useState(true);
  const [solution, setSolution] = useState('');
  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails);

  function handleOrderClosed() {
    if (!solution) {
      return Alert.alert('Atenção', 'Por favor, informe a solução do problema');
    }

    firestore()
      .collection('orders')
      .doc(orderId)
      .update({
        status: 'closed',
        solution,
        closed_at: firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        Alert.alert('Solicitação', 'Solicitação fechada com sucesso');
        navigation.goBack();
      })
      .catch((error) => {
        console.log(error);
        Alert.alert('Atenção', 'Erro ao fechar solicitação');
      });
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .get()
      .then((doc) => {
        const {
          patrimony,
          description,
          status,
          created_at,
          closed_at,
          solution,
        } = doc.data() as OrderFirestoreDTO;

        const closed = closed_at ? dateFormat(closed_at) : null;

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: dateFormat(created_at),
          closed,
        });

        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <VStack flex={1} bg="gray.700">
      <Box px={6} bg="gray.600">
        <Header title="Solicitação" />
      </Box>

      <HStack bg="gray.500" justifyContent="center" p={4}>
        {order.status === 'closed' ? (
          <CircleWavyCheck size={22} color={colors.green[300]} />
        ) : (
          <Hourglass size={22} color={colors.secondary[700]} />
        )}

        <Text
          fontSize="sm"
          color={
            order.status === 'closed'
              ? colors.green[300]
              : colors.secondary[700]
          }
          ml={2}
          textTransform="uppercase"
        >
          {order.status === 'closed' ? 'finalizado' : 'em andamento'}
        </Text>
      </HStack>

      <ScrollView mx={5} showsVerticalScrollIndicator={false}>
        <CardDetails
          title="Equipamento"
          description={`Patrimônio ${order.patrimony}`}
          icon={DesktopTower}
          footer={`Solicitado em ${order.when}`}
        />

        <CardDetails
          title="Descrição do problema"
          description={order.description}
          icon={Clipboard}
        />

        <CardDetails
          title="Solução"
          icon={CircleWavyCheck}
          description={order.solution}
          footer={order.closed && `Finalizado em ${order.closed}`}
        >
          {
            order.status === 'open' && (
            <Input
            placeholder="Descreva a solução aqui"
            onChangeText={setSolution}
            textAlignVertical="top"
            multiline
            h={24}
          />)}
        </CardDetails>
      </ScrollView>
      {order.status === 'open' && (
        <Button
          m={5}
          title="Encerrar solicitação"
          onPress={handleOrderClosed}
        />
      )}
    </VStack>
  );
}
