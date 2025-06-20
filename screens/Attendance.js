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

const Attendance = ({ navigation }) => {
    const [students, setStudents] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('A');
    const [showModal, setShowModal] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [attendanceForm, setAttendanceForm] = useState({
        status: 'Pendente',
        topics: '',
        attachmentName: '',
        attachmentContent: ''
    });

    const fetchAttendance = useCallback(async () => {
        try {
            const allStudents = await dbService.getStudents();
            setStudents(allStudents.filter(s => s.classId === selectedClass));

            const logs = await dbService.getAttendanceForDate(selectedClass, selectedDate);
            const logsMap = {};
            logs.forEach(log => logsMap[log.studentId] = log);
            setAttendanceLogs(logsMap);
        } catch (error) {
            console.error('Erro ao buscar frequência:', error);
            Alert.alert('Erro', 'Falha ao carregar dados de frequência');
        }
    }, [selectedDate, selectedClass]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleRecordAttendance = (student) => {
        setCurrentStudent(student);
        const existingLog = attendanceLogs[student.id];
        setAttendanceForm({
            status: existingLog?.status || 'Pendente',
            topics: existingLog?.topics || '',
            attachmentName: existingLog?.attachmentName || '',
            attachmentContent: existingLog?.attachmentContent || ''
        });
        setShowModal(true);
    };

    const handleSaveAttendance = async () => {
        try {
            const logId = `${currentStudent.id}-${selectedClass}-${selectedDate}`;
            const logData = {
                id: logId,
                studentId: currentStudent.id,
                classId: selectedClass,
                logDate: selectedDate,
                status: attendanceForm.status,
                topics: attendanceForm.topics,
                attachmentName: attendanceForm.attachmentName,
                attachmentContent: attendanceForm.attachmentContent
            };

            await dbService.upsertAttendance(logData);
            setShowModal(false);
            fetchAttendance();
            Alert.alert('Sucesso', 'Frequência registrada com sucesso!');
        } catch (error) {
            console.error('Erro ao registrar frequência:', error);
            Alert.alert('Erro', 'Falha ao registrar frequência');
        }
    };

    const renderAttendance = ({ item }) => {
        const log = attendanceLogs[item.id] || { status: 'Pendente', topics: '', attachmentName: '' };
        
        return (
            <View style={styles.attendanceCard}>
                <View style={styles.attendanceInfo}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={[
                        styles.attendanceStatus,
                        { 
                            color: log.status === 'Presente' ? '#10b981' : 
                                  log.status === 'Ausente' ? '#ef4444' : '#6b7280'
                        }
                    ]}>
                        Status: {log.status}
                    </Text>
                    {log.topics && (
                        <Text style={styles.attendanceDetail}>
                            Tópicos: {log.topics.substring(0, 50)}
                            {log.topics.length > 50 ? '...' : ''}
                        </Text>
                    )}
                    {log.attachmentName && (
                        <Text style={styles.attendanceDetail}>
                            Anexo: {log.attachmentName}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.recordButton}
                    onPress={() => handleRecordAttendance(item)}
                >
                    <Text style={styles.recordButtonText}>Registrar</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gerenciar Frequência</Text>
            
            <View style={styles.filterContainer}>
                <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Data: {selectedDate}</Text>
                    <Text style={styles.filterLabel}>Turma: {selectedClass}</Text>
                </View>
                <View style={styles.classButtons}>
                    <TouchableOpacity
                        style={[
                            styles.classButton,
                            selectedClass === 'A' && styles.classButtonActive
                        ]}
                        onPress={() => setSelectedClass('A')}
                    >
                        <Text style={[
                            styles.classButtonText,
                            selectedClass === 'A' && styles.classButtonTextActive
                        ]}>
                            Turma A
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.classButton,
                            selectedClass === 'B' && styles.classButtonActive
                        ]}
                        onPress={() => setSelectedClass('B')}
                    >
                        <Text style={[
                            styles.classButtonText,
                            selectedClass === 'B' && styles.classButtonTextActive
                        ]}>
                            Turma B
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={students}
                renderItem={renderAttendance}
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
                            Registrar Frequência para {currentStudent?.name}
                        </Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.sectionTitle}>Status de Presença</Text>
                        <View style={styles.statusButtons}>
                            {['Presente', 'Ausente', 'Pendente'].map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.statusButton,
                                        attendanceForm.status === status && styles.statusButtonActive,
                                        status === 'Presente' && attendanceForm.status === status && styles.presentButton,
                                        status === 'Ausente' && attendanceForm.status === status && styles.absentButton
                                    ]}
                                    onPress={() => setAttendanceForm(prev => ({ ...prev, status }))}
                                >
                                    <Text style={[
                                        styles.statusButtonText,
                                        attendanceForm.status === status && styles.statusButtonTextActive
                                    ]}>
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Tópicos Abordados:</Text>
                        <TextInput
                            style={styles.textArea}
                            value={attendanceForm.topics}
                            onChangeText={(text) => setAttendanceForm(prev => ({ ...prev, topics: text }))}
                            placeholder="Descreva os tópicos abordados na aula..."
                            multiline
                            numberOfLines={4}
                        />

                        <Text style={styles.label}>Anexo:</Text>
                        <TouchableOpacity style={styles.attachmentButton}>
                            <Text style={styles.attachmentButtonText}>Anexar Arquivo</Text>
                        </TouchableOpacity>
                        {attendanceForm.attachmentName && (
                            <Text style={styles.attachmentName}>
                                {attendanceForm.attachmentName}
                            </Text>
                        )}
                        <Text style={styles.attachmentNote}>
                            Nota: Funcionalidade de anexo será implementada com acesso a arquivos do dispositivo
                        </Text>
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton]}
                            onPress={handleSaveAttendance}
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
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    classButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    classButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
    },
    classButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    classButtonText: {
        color: '#374151',
        fontWeight: 'bold',
    },
    classButtonTextActive: {
        color: '#ffffff',
    },
    attendanceCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    attendanceInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    attendanceStatus: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    attendanceDetail: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    recordButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    recordButtonText: {
        color: '#ffffff',
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    closeButton: {
        fontSize: 24,
        color: '#6b7280',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12,
    },
    statusButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    statusButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        minWidth: 80,
        alignItems: 'center',
    },
    statusButtonActive: {
        borderColor: '#3b82f6',
    },
    presentButton: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    absentButton: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
    },
    statusButtonText: {
        color: '#374151',
        fontWeight: 'bold',
    },
    statusButtonTextActive: {
        color: '#ffffff',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#ffffff',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    attachmentButton: {
        backgroundColor: '#eef2ff',
        borderWidth: 1,
        borderColor: '#c7d2fe',
        borderRadius: 6,
        padding: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    attachmentButtonText: {
        color: '#4f46e5',
        fontWeight: 'bold',
    },
    attachmentName: {
        fontSize: 14,
        color: '#3b82f6',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    attachmentNote: {
        fontSize: 12,
        color: '#6b7280',
        fontStyle: 'italic',
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

export default Attendance;

