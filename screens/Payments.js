import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Alert,
    Modal
} from 'react-native';
import dbService from '../services/dbService';

const Payments = ({ navigation }) => {
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState({});
    const [selectedMonth, setSelectedMonth] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);

    const fetchPayments = useCallback(async () => {
        try {
            const allStudents = await dbService.getStudents();
            setStudents(allStudents);

            const monthYear = selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            setSelectedMonth(monthYear);

            const monthPayments = await dbService.getPaymentsForMonth(monthYear);
            const paidStatus = {};
            monthPayments.forEach(p => paidStatus[p.studentId] = true);
            setPayments(paidStatus);
        } catch (error) {
            console.error('Erro ao buscar pagamentos:', error);
            Alert.alert('Erro', 'Falha ao carregar dados de pagamentos');
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleRecordPayment = (student) => {
        setCurrentStudent(student);
        setShowModal(true);
    };

    const handleSavePayment = async () => {
        try {
            await dbService.recordPayment(currentStudent.id, selectedMonth);
            setShowModal(false);
            fetchPayments();
            Alert.alert('Sucesso', 'Pagamento registrado com sucesso!');
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            Alert.alert('Erro', 'Falha ao registrar pagamento');
        }
    };

    const getMonthName = (monthYear) => {
        if (!monthYear) return '';
        const [year, month] = monthYear.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    };

    const renderPayment = ({ item }) => (
        <View style={styles.paymentCard}>
            <View style={styles.paymentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.paymentDetail}>Valor: R$ {item.amount.toFixed(2)}</Text>
                <Text style={[
                    styles.paymentStatus,
                    { color: payments[item.id] ? '#10b981' : '#ef4444' }
                ]}>
                    Status: {payments[item.id] ? 'Pago' : 'Pendente'}
                </Text>
            </View>
            <View style={styles.paymentActions}>
                {!payments[item.id] && (
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handleRecordPayment(item)}
                    >
                        <Text style={styles.payButtonText}>Registrar Pagamento</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gerenciar Pagamentos</Text>
            
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>
                    Mês/Ano: {getMonthName(selectedMonth)}
                </Text>
                <Text style={styles.filterNote}>
                    (Mostrando dados para {selectedMonth})
                </Text>
            </View>

            <FlatList
                data={students}
                renderItem={renderPayment}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
            />

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Registrar Pagamento</Text>
                        <Text style={styles.modalText}>
                            Confirmar pagamento para{' '}
                            <Text style={styles.modalStudentName}>
                                {currentStudent?.name}
                            </Text>
                            {' '}referente a{' '}
                            <Text style={styles.modalMonth}>
                                {getMonthName(selectedMonth)}
                            </Text>
                            ?
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleSavePayment}
                            >
                                <Text style={styles.modalButtonText}>Confirmar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    filterContainer: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    filterNote: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    paymentCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    paymentInfo: {
        marginBottom: 12,
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    paymentDetail: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    paymentStatus: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    paymentActions: {
        alignItems: 'flex-end',
    },
    payButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    payButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        margin: 20,
        minWidth: 300,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    modalStudentName: {
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    modalMonth: {
        fontWeight: 'bold',
        color: '#10b981',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 6,
        minWidth: 100,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#3b82f6',
    },
    cancelButton: {
        backgroundColor: '#6b7280',
    },
    modalButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default Payments;

