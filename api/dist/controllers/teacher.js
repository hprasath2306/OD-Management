import { teacherService } from "../services/teacher.js";
export class TeacherController {
    // Create teacher
    async createTeacher(req, res) {
        try {
            const { name, email, phone, departmentId } = req.body;
            // Check if teacher with email already exists
            const existingTeacher = await teacherService.getTeacherByEmail(email);
            if (existingTeacher) {
                res.status(400).json({
                    success: false,
                    message: "Teacher with this email already exists",
                });
                return;
            }
            // Use default password
            const password = "psnacet";
            const teacher = await teacherService.createTeacher({
                name,
                email,
                phone,
                password,
                departmentId,
            });
            res.status(201).json({
                success: true,
                data: teacher,
                message: "Teacher created successfully",
            });
        }
        catch (error) {
            console.error("Error creating teacher:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error creating teacher",
            });
        }
    }
    //bulk create teacher
    async bulkCreateTeachers(req, res) {
        try {
            const teachers = req.body;
            // console.log(teachers);
            const createdTeachers = await teacherService.bulkCreateTeachers(teachers);
            res.status(201).json({
                success: true,
                data: createdTeachers,
                message: "Teachers created successfully",
            });
        }
        catch (error) {
            console.error("Error creating teachers:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error creating teachers",
            });
        }
    }
    // Get all teachers
    async getAllTeachers(req, res) {
        try {
            const teachers = await teacherService.getAllTeachers();
            res.status(200).json({
                success: true,
                data: teachers,
                message: "Teachers retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving teachers:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving teachers",
            });
        }
    }
    // Get teacher by ID
    async getTeacherById(req, res) {
        try {
            const { id } = req.params;
            const teacher = await teacherService.getTeacherById(id);
            if (!teacher) {
                res.status(404).json({
                    success: false,
                    message: "Teacher not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: teacher,
                message: "Teacher retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving teacher:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving teacher",
            });
        }
    }
    // Update teacher
    async updateTeacher(req, res) {
        try {
            const { id } = req.params;
            const { name, email, phone, departmentId, designationIds } = req.body;
            console.log("fgfed" + name, email, phone, departmentId);
            // Check if email is being updated and if it already exists
            if (email) {
                const existingTeacher = await teacherService.getTeacherByEmail(email);
                if (existingTeacher && existingTeacher.id !== id) {
                    res.status(400).json({
                        success: false,
                        message: "Email already in use by another teacher",
                    });
                    return;
                }
            }
            const teacher = await teacherService.updateTeacher(id, {
                name,
                email,
                phone,
                departmentId,
            });
            res.status(200).json({
                success: true,
                data: teacher,
                message: "Teacher updated successfully",
            });
        }
        catch (error) {
            console.error("Error updating teacher:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error updating teacher",
            });
        }
    }
    // Delete teacher
    async deleteTeacher(req, res) {
        try {
            const { id } = req.params;
            await teacherService.deleteTeacher(id);
            res.status(200).json({
                success: true,
                message: "Teacher deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting teacher:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error deleting teacher",
            });
        }
    }
}
export const teacherController = new TeacherController();
