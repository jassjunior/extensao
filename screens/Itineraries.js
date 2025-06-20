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

const Itineraries = ({ route, navigation }) => {
    const [itineraries, setItineraries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItinerary, setCurrentItinerary] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        instructions: '',
        attachmentName: '',
        attachmentContent: ''
    });

    useEffect(() => {
        if (route.params?.student) {
            setSelectedStudent(route.params.student);
        }
    }, [route.params]);

    const fetchItineraries = useCallback(async () => {
        if (selectedStudent) {
            try {
                const data = await dbService.getItinerariesForStudent(selectedStudent.id);
                setItineraries(data);
            } catch (error) {
                console.error('Erro ao buscar roteiros:', error);
                Alert.alert('Erro', 'Falha ao carregar roteiros');
            }
        }
    }, [selectedStudent]);

    useEffect(() => {
        fetchItineraries();
    }, [fetchItineraries]);

    const handleAddItinerary = () => {
        setIsEditing(false);
        setCurrentItinerary(null);
        setFormData({
            title: '',
            instructions: '',
            attachmentName: '',
            attachmentContent: ''
        });
        setShowModal(true);
    };

    const handleEditItinerary = (itinerary) => {
        setIsEditing(true);
        setCurrentItinerary(itinerary);
        setFormData({
            title: itinerary.title,
            instructions: itinerary.instructions,
            attachmentName: itinerary.attachmentName,
            attachmentContent: itinerary.attachmentContent
        });
        setShowModal(true);
    };

    const handleDeleteItinerary = async (itineraryId) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este roteiro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log(`Attempting to delete itinerary with ID: ${itineraryId}`);
                            await dbService.deleteItinerary(itineraryId);
                            console.log(`Itinerary ${itineraryId} deleted successfully.`);
                            fetchItineraries();
                            Alert.alert('Sucesso', 'Roteiro excluído com sucesso!');
                        } catch (error) {
                            console.error('Erro ao excluir roteiro:', error);
                            Alert.alert('Erro', `Falha ao excluir roteiro: ${error.message}`);
                        }
                    }
                }
            ]
        );
    };

    const handleSaveItinerary = async () => {
        try {
            if (isEditing) {
                await dbService.updateItinerary({ ...formData, id: currentItinerary.id });
            } else {
                await dbService.addItinerary({
                    ...formData,
                    id: `it${Date.now()}`,
                    studentId: selectedStudent.id,
                    createdDate: new Date().toISOString()
                });
            }
            setShowModal(false);
            fetchItineraries();
            Alert.alert('Sucesso', 'Roteiro salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar roteiro:', error);
            Alert.alert('Erro', 'Falha ao salvar roteiro');
        }
    };

    const renderItinerary = ({ item }) => (
        <View style={styles.itineraryCard}>
            <View style={styles.itineraryInfo}>
                <Text style={styles.itineraryTitle}>{item.title}</Text>
                <Text style={styles.itineraryInstructions}>
                    {item.instructions.substring(0, 100)}
                    {item.instructions.length > 100 ? '...' : ''}
                </Text>
                {item.attachmentName && (
                    <Text style={styles.itineraryAttachment}>
                        📎 {item.attachmentName}
                    </Text>
                )}
                <Text style={styles.itineraryDate}>
                    Criado em: {new Date(item.createdDate).toLocaleDateString('pt-BR')}
                </Text>
            </View>
            <View style={styles.itineraryActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditItinerary(item)}
                >
                    <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteItinerary(item.id)}
                >
                    <Text style={styles.actionButtonText}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!selectedStudent) {
        return (
            <View style={styles.noStudentContainer}>
                <Text style={styles.noStudentTitle}>Roteiros de Estudo</Text>
                <Text style={styles.noStudentMessage}>
                    Selecione um aluno na seção 'Alunos' para visualizar e gerenciar roteiros.
                </Text>
                <TouchableOpacity 
                    style={styles.goToStudentsButton}
                    onPress={() => navigation.navigate('Students')}
                >
                    <Text style={styles.goToStudentsButtonText}>Ir para Alunos</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    Roteiros de Estudo para {selectedStudent.name}
                </Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddItinerary}>
                    <Text style={styles.addButtonText}>Adicionar Roteiro</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={itineraries}
                renderItem={renderItinerary}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            Nenhum roteiro encontrado para este aluno.
                        </Text>
                    </View>
                }
            />

            <Modal
                visible={showModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {isEditing ? 'Editar Roteiro' : 'Adicionar Roteiro'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.label}>Título:</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.title}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                            placeholder="Título do roteiro"
                        />

                        <Text style={styles.label}>Instruções:</Text>
                        <TextInput
                            style={styles.textArea}
                            value={formData.instructions}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
                            placeholder="Descreva as instruções detalhadas do roteiro..."
                            multiline
                            numberOfLines={6}
                        />

                        <Text style={styles.label}>Anexo:</Text>
                        <TouchableOpacity style={styles.attachmentButton}>
                            <Text style={styles.attachmentButtonText}>Anexar Arquivo</Text>
                        </TouchableOpacity>
                        {formData.attachmentName && (
                            <Text style={styles.attachmentName}>
                                {formData.attachmentName}
                            </Text>
                        )}
                        <Text style={styles.attachmentNote}>
                            Nota: Funcionalidade de anexo será implementada com acesso a arquivos do dispositivo
                        </Text>
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton]}
                            onPress={handleSaveItinerary}
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
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    addButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    itineraryCard: {
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
    itineraryInfo: {
        marginBottom: 12,
    },
    itineraryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    itineraryInstructions: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 8,
    },
    itineraryAttachment: {
        fontSize: 14,
        color: '#3b82f6',
        marginBottom: 8,
    },
    itineraryDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    itineraryActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        minWidth: 80,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#10b981',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
    },
    actionButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    noStudentContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noStudentTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 20,
    },
    noStudentMessage: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    goToStudentsButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 6,
    },
    goToStudentsButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
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
    textArea: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#ffffff',
        minHeight: 120,
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

export default Itineraries;


