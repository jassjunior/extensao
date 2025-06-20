import * as SQLite from 'expo-sqlite';

// --- Módulo de Banco de Dados (dbService) para React Native ---
const dbService = {
    db: null,
    
    async init() {
        try {
            // Abre ou cria o banco de dados SQLite
            this.db = await SQLite.openDatabaseAsync('reforco_escolar.db');
            await this.createTables();
            await this.populateInitialData();
        } catch (err) {
            console.error("Falha ao inicializar o banco de dados:", err);
        }
    },

    async createTables() {
        try {
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS students (
                    id TEXT PRIMARY KEY, 
                    name TEXT, 
                    guardian TEXT, 
                    contact TEXT,
                    school TEXT, 
                    grade TEXT, 
                    report TEXT, 
                    allergy TEXT, 
                    classId TEXT,
                    paymentDay INTEGER, 
                    amount REAL, 
                    registrationDate TEXT
                );
                
                CREATE TABLE IF NOT EXISTS payment_records (
                    id TEXT PRIMARY KEY, 
                    studentId TEXT, 
                    monthYear TEXT, 
                    datePaid TEXT
                );
                
                CREATE TABLE IF NOT EXISTS attendance_logs (
                    id TEXT PRIMARY KEY, 
                    studentId TEXT, 
                    classId TEXT, 
                    logDate TEXT, 
                    status TEXT, 
                    topics TEXT, 
                    attachmentName TEXT, 
                    attachmentContent TEXT
                );
                
                CREATE TABLE IF NOT EXISTS itineraries (
                    id TEXT PRIMARY KEY, 
                    studentId TEXT, 
                    title TEXT, 
                    instructions TEXT, 
                    attachmentName TEXT, 
                    attachmentContent TEXT, 
                    createdDate TEXT
                );
            `);
            console.log("Tabelas criadas ou já existentes.");
        } catch (error) {
            console.error("Erro ao criar tabelas:", error);
            throw error; // Re-throw para que o erro seja tratado na inicialização
        }
    },

    async populateInitialData() {
        try {
            const result = await this.db.getFirstAsync("SELECT count(*) as count FROM students");
            if (result.count === 0) {
                const initialStudents = [
                    { 
                        id: 's1', 
                        name: 'Ana Silva', 
                        guardian: 'Mariana Silva', 
                        contact: '(86) 99999-1111', 
                        school: 'Escola ABC', 
                        grade: '5º Ano', 
                        report: 'N/A', 
                        allergy: 'Nenhuma', 
                        classId: 'A', 
                        paymentDay: 10, 
                        amount: 250.00, 
                        registrationDate: new Date(2025, 4, 15).toISOString() 
                    },
                    { 
                        id: 's2', 
                        name: 'Bruno Costa', 
                        guardian: 'Ricardo Costa', 
                        contact: '(86) 99999-2222', 
                        school: 'Escola XYZ', 
                        grade: '4º Ano', 
                        report: 'Dislexia', 
                        allergy: 'Amendoim', 
                        classId: 'A', 
                        paymentDay: 5, 
                        amount: 250.00, 
                        registrationDate: new Date(2025, 4, 20).toISOString() 
                    }
                ];

                for (const student of initialStudents) {
                    await this.addStudent(student);
                }

                // Registra um pagamento para o primeiro aluno no mês atual
                const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                await this.recordPayment('s1', currentMonthYear);
                console.log("Dados iniciais populados.");
            } else {
                console.log("Dados iniciais já existem, pulando população.");
            }
        } catch (error) {
            console.error("Erro ao popular dados iniciais:", error);
            throw error;
        }
    },

    async getStudents() {
        try {
            return await this.db.getAllAsync("SELECT * FROM students ORDER BY name ASC");
        } catch (error) {
            console.error("Erro ao buscar alunos:", error);
            throw error;
        }
    },

    async addStudent(student) {
        try {
            await this.db.runAsync(
                "INSERT INTO students VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                [
                    student.id, 
                    student.name, 
                    student.guardian, 
                    student.contact, 
                    student.school, 
                    student.grade, 
                    student.report, 
                    student.allergy, 
                    student.classId, 
                    student.paymentDay, 
                    student.amount, 
                    student.registrationDate
                ]
            );
            console.log(`Aluno ${student.name} adicionado com sucesso.`);
        } catch (error) {
            console.error(`Erro ao adicionar aluno ${student.name}:`, error);
            throw error;
        }
    },

    async updateStudent(student) {
        try {
            await this.db.runAsync(
                "UPDATE students SET name=?, guardian=?, contact=?, school=?, grade=?, report=?, allergy=?, classId=?, paymentDay=?, amount=? WHERE id=?", 
                [
                    student.name, 
                    student.guardian, 
                    student.contact, 
                    student.school, 
                    student.grade, 
                    student.report, 
                    student.allergy, 
                    student.classId, 
                    student.paymentDay, 
                    student.amount, 
                    student.id
                ]
            );
            console.log(`Aluno ${student.name} atualizado com sucesso.`);
        } catch (error) {
            console.error(`Erro ao atualizar aluno ${student.name}:`, error);
            throw error;
        }
    },

    async deleteStudent(studentId) {
        try {
            console.log(`Tentando excluir aluno com ID: ${studentId}`);
            await this.db.runAsync("DELETE FROM students WHERE id = ?", [studentId]);
            console.log(`Aluno ${studentId} excluído da tabela students.`);

            await this.db.runAsync("DELETE FROM payment_records WHERE studentId = ?", [studentId]);
            console.log(`Registros de pagamento para ${studentId} excluídos.`);

            await this.db.runAsync("DELETE FROM attendance_logs WHERE studentId = ?", [studentId]);
            console.log(`Registros de frequência para ${studentId} excluídos.`);

            await this.db.runAsync("DELETE FROM itineraries WHERE studentId = ?", [studentId]);
            console.log(`Roteiros para ${studentId} excluídos.`);

            console.log(`Exclusão completa para o aluno ${studentId}.`);
        } catch (error) {
            console.error(`Erro ao excluir aluno ${studentId} ou dados relacionados:`, error);
            throw error; // Re-throw para que o erro seja tratado no componente
        }
    },

    async getPaymentsForMonth(monthYear) {
        try {
            return await this.db.getAllAsync("SELECT * FROM payment_records WHERE monthYear = ?", [monthYear]);
        } catch (error) {
            console.error(`Erro ao buscar pagamentos para ${monthYear}:`, error);
            throw error;
        }
    },

    async recordPayment(studentId, monthYear) {
        try {
            const id = `${studentId}-${monthYear}`;
            const datePaid = new Date().toISOString();
            await this.db.runAsync(
                "INSERT OR REPLACE INTO payment_records (id, studentId, monthYear, datePaid) VALUES (?, ?, ?, ?)", 
                [id, studentId, monthYear, datePaid]
            );
            console.log(`Pagamento para ${studentId} em ${monthYear} registrado.`);
        } catch (error) {
            console.error(`Erro ao registrar pagamento para ${studentId} em ${monthYear}:`, error);
            throw error;
        }
    },

    async getAttendanceForDate(classId, date) {
        try {
            return await this.db.getAllAsync("SELECT * FROM attendance_logs WHERE classId = ? AND logDate = ?", [classId, date]);
        } catch (error) {
            console.error(`Erro ao buscar frequência para ${classId} em ${date}:`, error);
            throw error;
        }
    },

    async upsertAttendance(log) {
        try {
            await this.db.runAsync(
                `INSERT INTO attendance_logs (id, studentId, classId, logDate, status, topics, attachmentName, attachmentContent) 
                 VALUES (?,?,?,?,?,?,?,?) 
                 ON CONFLICT(id) DO UPDATE SET 
                    status=excluded.status, 
                    topics=excluded.topics, 
                    attachmentName=excluded.attachmentName, 
                    attachmentContent=excluded.attachmentContent`,
                [
                    log.id, 
                    log.studentId, 
                    log.classId, 
                    log.logDate, 
                    log.status, 
                    log.topics, 
                    log.attachmentName, 
                    log.attachmentContent
                ]
            );
            console.log(`Frequência para ${log.studentId} em ${log.logDate} atualizada/inserida.`);
        } catch (error) {
            console.error(`Erro ao atualizar/inserir frequência para ${log.studentId}:`, error);
            throw error;
        }
    },

    async getItinerariesForStudent(studentId) {
        try {
            return await this.db.getAllAsync("SELECT * FROM itineraries WHERE studentId = ? ORDER BY createdDate DESC", [studentId]);
        } catch (error) {
            console.error(`Erro ao buscar roteiros para ${studentId}:`, error);
            throw error;
        }
    },

    async addItinerary(itinerary) {
        try {
            await this.db.runAsync(
                "INSERT INTO itineraries VALUES (?,?,?,?,?,?,?)", 
                [
                    itinerary.id, 
                    itinerary.studentId, 
                    itinerary.title, 
                    itinerary.instructions, 
                    itinerary.attachmentName, 
                    itinerary.attachmentContent, 
                    itinerary.createdDate
                ]
            );
            console.log(`Roteiro ${itinerary.title} adicionado para ${itinerary.studentId}.`);
        } catch (error) {
            console.error(`Erro ao adicionar roteiro ${itinerary.title}:`, error);
            throw error;
        }
    },

    async updateItinerary(itinerary) {
        try {
            await this.db.runAsync(
                "UPDATE itineraries SET title=?, instructions=?, attachmentName=?, attachmentContent=? WHERE id=?", 
                [
                    itinerary.title, 
                    itinerary.instructions, 
                    itinerary.attachmentName, 
                    itinerary.attachmentContent, 
                    itinerary.id
                ]
            );
            console.log(`Roteiro ${itinerary.id} atualizado.`);
        } catch (error) {
            console.error(`Erro ao atualizar roteiro ${itinerary.id}:`, error);
            throw error;
        }
    },

    async deleteItinerary(itineraryId) {
        try {
            console.log(`Tentando excluir roteiro com ID: ${itineraryId}`);
            await this.db.runAsync("DELETE FROM itineraries WHERE id = ?", [itineraryId]);
            console.log(`Roteiro ${itineraryId} excluído.`);
        } catch (error) {
            console.error(`Erro ao excluir roteiro ${itineraryId}:`, error);
            throw error; // Re-throw para que o erro seja tratado no componente
        }
    }
};

export default dbService;

