import { RequestService } from './request.js';
import { NotificationService } from './notification.js';
import { TeacherService } from './teacher.js';
import { StudentService } from './student.js';
import { GroupService } from './group.js';
import { DepartmentService } from './department.js';
import { LabService } from './lab.js';
import { FlowTemplateService } from './flowTemplate.js';
import { FlowStepService } from './flowStep.js';
import { DesignationService } from './designation.js';
import { TeacherDesignationService } from './teacherDesignation.js';
import { GroupApproverService } from './groupApprover.js';

// Create instances
export const requestService = new RequestService();
export const notificationService = new NotificationService();
export const teacherService = new TeacherService();
export const studentService = new StudentService();
export const groupService = new GroupService();
export const departmentService = new DepartmentService();
export const labService = new LabService();
export const flowTemplateService = new FlowTemplateService();
export const flowStepService = new FlowStepService();
export const designationService = new DesignationService();
export const teacherDesignationService = new TeacherDesignationService();
export const groupApproverService = new GroupApproverService(); 