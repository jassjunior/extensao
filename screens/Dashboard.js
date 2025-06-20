import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import dbService from '../services/dbService';

const Dashboard = ({ navigation }) => {
    const [totalStudents, setTotalStudents] = useState(0);
    const [pendingPayments, setPendingPayments] = useState(0);
    const [upcomingClasses, setUpcomingClasses] = useState(3); // Placeholder

    useEffect(() => {
        const fetchData = async () => {
            try {
                const students = await dbService.getStudents();
                setTotalStudents(students.length);

                const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                const payments = await dbService.getPaymentsForMonth(currentMonthYear);
                const paidStudentIds = new Set(payments.map(p => p.studentId));
                const studentsToPay = students.filter(s => !paidStudentIds.has(s.id));
                setPendingPayments(studentsToPay.length);
            } catch (error) {
                console.error('Erro ao buscar dados do dashboard:', error);
                Alert.alert('Erro', 'Falha ao carregar dados do dashboard');
            }
        };
        fetchData();
    }, []);

    const dashboardCards = [
        {
            id: '1',
            title: 'Total de Alunos',
            value: totalStudents,
            screen: 'Students',
            color: '#3b82f6'
        },
        {
            id: '2',
            title: 'Pagamentos Pendentes',
            value: pendingPayments,
            screen: 'Payments',
            color: '#ef4444'
        },
        {
            id: '3',
            title: 'Próximas Aulas',
            value: upcomingClasses,
            screen: 'Attendance',
            color: '#10b981'
        }
    ];

    const renderCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
        >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={[styles.cardValue, { color: item.color }]}>{item.value}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>
            <FlatList
                data={dashboardCards}
                renderItem={renderCard}
                keyExtractor={item => item.id}
                numColumns={1}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 20,
        marginBottom: 15,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
});

export default Dashboard;

