import { groupService } from "../services/group.js";
export class GroupController {
    // Create group
    async createGroup(req, res) {
        try {
            const { name, section, batch, departmentId } = req.body;
            const group = await groupService.createGroup({
                name,
                section,
                batch,
                departmentId,
            });
            res.status(201).json({
                success: true,
                data: group,
                message: "Group created successfully",
            });
        }
        catch (error) {
            console.error("Error creating group:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error creating group",
            });
        }
    }
    // Get all groups
    async getAllGroups(req, res) {
        try {
            const groups = await groupService.getAllGroups();
            res.status(200).json({
                success: true,
                data: groups,
                message: "Groups retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving groups:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving groups",
            });
        }
    }
    // Get group by ID
    async getGroupById(req, res) {
        try {
            const { id } = req.params;
            const group = await groupService.getGroupById(id);
            if (!group) {
                res.status(404).json({
                    success: false,
                    message: "Group not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: group,
                message: "Group retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving group:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving group",
            });
        }
    }
    // Update group
    async updateGroup(req, res) {
        try {
            const { id } = req.params;
            const { name, section, batch, departmentId } = req.body;
            // Check if group exists
            const existingGroup = await groupService.getGroupById(id);
            if (!existingGroup) {
                res.status(404).json({
                    success: false,
                    message: "Group not found",
                });
                return;
            }
            const group = await groupService.updateGroup(id, {
                name,
                section,
                batch,
                departmentId,
            });
            res.status(200).json({
                success: true,
                data: group,
                message: "Group updated successfully",
            });
        }
        catch (error) {
            console.error("Error updating group:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error updating group",
            });
        }
    }
    // Delete group
    async deleteGroup(req, res) {
        try {
            const { id } = req.params;
            // Check if group exists
            const existingGroup = await groupService.getGroupById(id);
            if (!existingGroup) {
                res.status(404).json({
                    success: false,
                    message: "Group not found",
                });
                return;
            }
            await groupService.deleteGroup(id);
            res.status(200).json({
                success: true,
                message: "Group deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting group:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error deleting group",
            });
        }
    }
    // Get groups by department
    async getGroupsByDepartment(req, res) {
        try {
            const { departmentId } = req.params;
            const groups = await groupService.getGroupsByDepartment(departmentId);
            res.status(200).json({
                success: true,
                data: groups,
                message: "Groups retrieved successfully",
            });
        }
        catch (error) {
            console.error("Error retrieving groups:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error retrieving groups",
            });
        }
    }
}
export const groupController = new GroupController();
