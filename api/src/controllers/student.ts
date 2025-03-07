import { Request, Response } from "express";
import { studentService } from "../services/student";

export class StudentController {
  // Create student
  async createStudent(req: Request, res: Response) {
    try {
      const { name, email, phone, rollNo, regNo, attendancePercentage, groupId ,departmentId} = req.body;

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
    } catch (error: any) {
      console.error("Error creating student:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error creating student",
      });
    }
  }

  //bulk create student
  async bulkCreateStudents(req: Request, res: Response) {
    try {
      const { students } = req.body;
      const createdStudents = await studentService.bulkCreateStudents({ students });
      res.status(201).json({
        success: true,
        data: createdStudents,
        message: "Students created successfully",
      });
    } catch (error: any) {
      console.error("Error creating students:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error creating students",
      });
    }
  }

  // Get all students
  async getAllStudents(req: Request, res: Response) {
    try {
      const students = await studentService.getAllStudents();
      res.status(200).json({
        success: true,
        data: students,
        message: "Students retrieved successfully",
      });
    } catch (error: any) {
      console.error("Error retrieving students:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error retrieving students",
      });
    }
  }

  // Get student by ID
  async getStudentById(req: Request, res: Response) {
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
    } catch (error: any) {
      console.error("Error retrieving student:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error retrieving student",
      });
    }
  }

  // Get student by registration number
  async getStudentByRegNo(req: Request, res: Response) {
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
    } catch (error: any) {
      console.error("Error retrieving student:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error retrieving student",
      });
    }
  }

  // Get students by group
  async getStudentsByGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const students = await studentService.getStudentsByGroup(groupId);

      res.status(200).json({
        success: true,
        data: students,
        message: "Students retrieved successfully",
      });
    } catch (error: any) {
      console.error("Error retrieving students:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error retrieving students",
      });
    }
  }

  // Update student
  async updateStudent(req: Request, res: Response) {
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
    } catch (error: any) {
      console.error("Error updating student:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error updating student",
      });
    }
  }

  // Delete student
  async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await studentService.deleteStudent(id);

      res.status(200).json({
        success: true,
        message: "Student deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting student:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error deleting student",
      });
    }
  }
}

export const studentController = new StudentController(); 