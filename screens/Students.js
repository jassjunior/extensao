import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ScrollView
} from 'react-native';
import dbService from '../services/dbService';

const Students = ({ navigation }) => {
    const [students, setStudents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        guardian: '',
        contact: '',
        school: '',
        grade: '',
        report: '',
        allergy: '',
        classId: '',
        paymentDay: '1',
        amount: '0.00'
    });

    const fetchStudents = useCallback(async () => {
        try {
            const data = await dbService.getStudents();
            setStudents(data);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
            Alert.alert('Erro', 'Falha ao carregar lista de alunos');
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleAddStudent = () => {
        setIsEditing(false);
        setCurrentStudent(null);
        setFormData({
            name: '',
            guardian: '',
            contact: '',
            school: '',
            grade: '',
            report: '',
            allergy: '',
            classId: '',
            paymentDay: '1',
            amount: '0.00'
        });
        setShowModal(true);
    };

    const handleEditStudent = (student) => {
        setIsEditing(true);
        setCurrentStudent(student);
        setFormData({
            name: student.name,
            guardian: student.guardian,
            contact: student.contact,
            school: student.school,
            grade: student.grade,
            report: student.report,
            allergy: student.allergy,
            classId: student.classId,
            paymentDay: student.paymentDay.toString(),
            amount: student.amount.toString()
        });
        setShowModal(true);
    };

    const handleDeleteStudent = async (studentId) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este aluno e todos os seus registros?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log(`Attempting to delete student with ID: ${studentId}`);
                            await dbService.deleteStudent(studentId);
                            console.log(`Student ${studentId} deleted successfully.`);
                            fetchStudents();
                            Alert.alert('Sucesso', 'Aluno excluído com sucesso!');
                        } catch (error) {
                            console.error('Erro ao excluir aluno:', error);
                            Alert.alert('Erro', `Falha ao excluir aluno: ${error.message}`);
                        }
                    }
                }
            ]
        );
    };

    const handleSaveStudent = async () => {
        try {
            const studentData = {
                ...formData,
                paymentDay: parseInt(formData.paymentDay),
                amount: parseFloat(formData.amount)
            };

            if (isEditing) {
                await dbService.updateStudent({ ...studentData, id: currentStudent.id });
            } else {
                await dbService.addStudent({
                    ...studentData,
                    id: `s${Date.now()}`,
                    registrationDate: new Date().toISOString()
                });
            }
            setShowModal(false);
            fetchStudents();
        } catch (error) {
            console.error('Erro ao salvar aluno:', error);
            Alert.alert('Erro', 'Falha ao salvar aluno');
        }
    };

    const renderStudent = ({ item }) => (
        <View style={styles.studentCard}>
            <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentDetail}>Responsável: {item.guardian}</Text>
                <Text style={styles.studentDetail}>Contato: {item.contact}</Text>
                <Text style={styles.studentDetail}>Escola: {item.school}</Text>
                <Text style={styles.studentDetail}>Série: {item.grade}</Text>
                <Text style={styles.studentDetail}>Turma: {item.classId}</Text>
                <Text style={styles.studentDetail}>Valor: R$ {item.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.studentActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditStudent(item)}
                >
                    <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.itineraryButton]}
                    onPress={() => navigation.navigate('Itineraries', { student: item })}
                >
                    <Text style={styles.actionButtonText}>Roteiros</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteStudent(item.id)}
                >
                    <Text style={styles.actionButtonText}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gerenciar Alunos</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
                    <Text style={styles.addButtonText}>Adicionar Aluno</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={students}
                renderItem={renderStudent}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
            />

            <Modal
                visible={showModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {isEditing ? 'Editar Aluno' : 'Adicionar Aluno'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.label}>Nome:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                            placeholder="Nome do aluno"
                        />

                        <Text style={styles.label}>Responsável:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.guardian}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, guardian: text }))}
                            placeholder="Nome do responsável"
                        />

                        <Text style={styles.label}>Contato:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.contact}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, contact: text }))}
                            placeholder="Telefone de contato"
                        />

                        <Text style={styles.label}>Escola:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.school}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, school: text }))}
                            placeholder="Nome da escola"
                        />

                        <Text style={styles.label}>Série:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.grade}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, grade: text }))}
                            placeholder="Série do aluno"
                        />

                        <Text style={styles.label}>Relatório:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.report}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, report: text }))}
                            placeholder="Relatório médico/pedagógico"
                        />

                        <Text style={styles.label}>Alergia:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.allergy}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, allergy: text }))}
                            placeholder="Alergias conhecidas"
                        />

                        <Text style={styles.label}>Turma:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.classId}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, classId: text }))}
                            placeholder="ID da turma"
                        />

                        <Text style={styles.label}>Dia de Pagamento:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.paymentDay}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, paymentDay: text }))}
                            placeholder="Dia do mês para pagamento"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Valor:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.amount}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                            placeholder="Valor da mensalidade"
                            keyboardType="numeric"
                        />
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton]}
                            onPress={handleSaveStudent}
                        >
                            <Text style={styles.modalButtonText}>Salvar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Cancelar</Text>
                        </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    addButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    studentCard: {
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
    studentInfo: {
        marginBottom: 12,
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    studentDetail: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    studentActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        minWidth: 70,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#10b981',
    },
    itineraryButton: {
        backgroundColor: '#6366f1',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButton: {
        fontSize: 24,
        color: '#6b7280',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#ffffff',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    modalButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
        minWidth: 100,
        alignItems: 'center',
    },
    saveButton: {
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

export default Students;


