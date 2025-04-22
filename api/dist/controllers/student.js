import { studentService } from "../services/student.js";
export class StudentController {
    // Create student
    async createStudent(req, res) {
        try {
            const { name, email, phone, rollNo, regNo, attendancePercentage, groupId, departmentId } = req.body;
            // Check if student with registration number already exists
            const existingStudent = await studentService.getStudentByRegNo(regNo);
            if (existingStudent) {
                res.status(400).json({
                    success: false,
                    message: "Student with this registration number already exists",
                });
                return;
            }
            const student = await studentService.createStudent({
                name,
                email,
                phone,
                rollNo,
                regNo,
                attendancePercentage,
                departmentId,
                groupId,
            });
            res.status(201).json({
                success: true,
                data: student,
                message: "Student created successfully",
            });
        }
        catch (error) {
            console.error("Error creating student:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error creating student",
            });
        }
    }
    //bulk create student
    async bulkCreateStudents(req, res) {
        try {
            const { students } = req.body;
            console.log(students);
            const createdStudents = await studentService.bulkCreateStudents({ students });
            res.status(201).json({
                success: true,
                data: createdStudents,
                message: "Students created successfully",
            });
        }
        catch (error) {
            console.error("Error creating students:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error creating students",
            });
        }
    }
    // Get all students
    async getAllStudents(req, res) {
        try {
            const students = await studentService.getAllStudents();
            res.status(200).json({
                success: true,
                data: students,
                message: "Students retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving students:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving students",
            });
        }
    }
    // Get student by ID
    async getStudentById(req, res) {
        try {
            const { id } = req.params;
            const student = await studentService.getStudentById(id);
            if (!student) {
                res.status(404).json({
                    success: false,
                    message: "Student not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: student,
                message: "Student retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving student:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving student",
            });
        }
    }
    // Get student by registration number
    async getStudentByRegNo(req, res) {
        try {
            const { regNo } = req.params;
            const student = await studentService.getStudentByRegNo(regNo);
            if (!student) {
                res.status(404).json({
                    success: false,
                    message: "Student not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: student,
                message: "Student retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving student:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving student",
            });
        }
    }
    // Get students by group
    async getStudentsByGroup(req, res) {
        try {
            const { groupId } = req.params;
            const students = await studentService.getStudentsByGroup(groupId);
            res.status(200).json({
                success: true,
                data: students,
                message: "Students retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving students:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving students",
            });
        }
    }
    // Update student
    async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const { name, email, phone, rollNo, regNo, attendancePercentage, groupId } = req.body;
            // Check if registration number is being updated and if it already exists
            if (regNo) {
                const existingStudent = await studentService.getStudentByRegNo(regNo);
                if (existingStudent && existingStudent.id !== id) {
                    res.status(400).json({
                        success: false,
                        message: "Registration number already in use by another student",
                    });
                    return;
                }
            }
            const student = await studentService.updateStudent(id, {
                name,
                email,
                phone,
                rollNo,
                regNo,
                attendancePercentage,
                groupId,
            });
            res.status(200).json({
                success: true,
                data: student,
                message: "Student updated successfully",
            });
        }
        catch (error) {
            console.error("Error updating student:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error updating student",
            });
        }
    }
    // Delete student
    async deleteStudent(req, res) {
        try {
            const { id } = req.params;
            await studentService.deleteStudent(id);
            res.status(200).json({
                success: true,
                message: "Student deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting student:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error deleting student",
            });
        }
    }
    // Reset student's OD count
    async resetStudentODCount(req, res) {
        try {
            const { id } = req.params;
            const updatedStudent = await studentService.resetODCount(id);
            res.status(200).json({
                success: true,
                data: updatedStudent,
                message: "Student OD count reset successfully",
            });
        }
        catch (error) {
            console.error("Error resetting student OD count:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error resetting OD count",
            });
        }
    }
    // Reset OD counts for all students in a group
    async resetGroupODCounts(req, res) {
        try {
            const { groupId } = req.params;
            const count = await studentService.resetGroupODCounts(groupId);
            res.status(200).json({
                success: true,
                count,
                message: `Reset OD count for ${count} students in the group`,
            });
        }
        catch (error) {
            console.error("Error resetting group OD counts:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error resetting group OD counts",
            });
        }
    }
}
export const studentController = new StudentController();
