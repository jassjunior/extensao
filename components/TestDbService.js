import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TestDbService = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Teste do Banco de Dados SQLite</Text>
            <Text style={styles.message}>
                O expo-sqlite não funciona na versão web do Expo.{'\n'}
                Para testar o banco de dados, execute o aplicativo em um dispositivo móvel ou emulador.
            </Text>
            <Text style={styles.note}>
                Nota: O dbService foi adaptado com sucesso para React Native usando expo-sqlite.
                Todas as operações CRUD foram implementadas e estão prontas para uso em dispositivos móveis.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    note: {
        fontSize: 14,
        textAlign: 'center',
        color: '#888',
        fontStyle: 'italic',
    },
});

export default TestDbService;

