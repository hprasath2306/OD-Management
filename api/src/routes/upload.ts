import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import prisma from '../db/config.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * Upload proof of OD directly (without requiring a request ID)
 * Allows users to upload images before creating the request
 */
router.post("/direct", authMiddleware, async (req: any, res: any) => {
    try {
        const { image } = req.body;
        
        // Ensure we have a file
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Upload file to Cloudinary
        const { url } = await uploadToCloudinary(image);

        // Return the URL
        return res.status(200).json({
            message: 'Image uploaded successfully',
            proofUrl: url
        });
    } catch (error: any) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ 
            error: 'Failed to upload image',
            details: error.message || 'Unknown error'
        });
    }
});

/**
 * Upload proof of OD
 * Route for uploading images as proof for OD requests
 * Requires authentication
 */
router.post("/:requestId", authMiddleware, async (req: any, res: any) => {
    try {
        const { file } = req.body;
        const { requestId } = req.params;
        const userId = res.locals.user.id;
        const userRole = res.locals.user.role;
        
        // Ensure we have a file and a request ID
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID is required' });
        }

        // Verify the request exists
        const request = await prisma.request.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // For students, verify they own the request
        if (userRole === UserRole.STUDENT) {
            const isOwner = await prisma.request.findFirst({
                where: {
                    id: requestId,
                    OR: [
                        { requestedById: userId },
                        {
                            students: {
                                some: {
                                    student: {
                                        userId: userId
                                    }
                                }
                            }
                        }
                    ]
                }
            });

            if (!isOwner) {
                return res.status(403).json({ error: 'You do not have permission to add proof to this request' });
            }
        }

        // Upload file to Cloudinary
        const { url } = await uploadToCloudinary(file);

        // Update the request with the proof URL using Prisma's type-safe API
        const updatedRequest = await prisma.$transaction(async (tx) => {
            return await tx.request.update({
                where: { id: requestId },
                data: { 
                    // Use any type to bypass TypeScript checking for now
                    // This field exists in the database schema as seen in schema.prisma
                    proofOfOD: url as any 
                },
            });
        });

        // Return the updated request
        return res.status(200).json({
            message: 'Proof uploaded successfully',
            proofUrl: url,
            requestId: updatedRequest.id
        });
    } catch (error: any) {
        console.error('Error uploading proof:', error);
        return res.status(500).json({ 
            error: 'Failed to upload proof',
            details: error.message || 'Unknown error'
        });
    }
});

/**
 * Get proof for a request
 * Retrieves the proof of OD for a specific request
 */
router.get("/:requestId", authMiddleware, async (req: any, res: any) => {
    try {
        const { requestId } = req.params;
        
        // Verify the request exists
        const request = await prisma.request.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Use type assertion to access the proofOfOD field
        const proofUrl = (request as any).proofOfOD;
        
        if (!proofUrl) {
            return res.status(404).json({ error: 'No proof found for this request' });
        }

        return res.status(200).json({
            proofUrl
        });
    } catch (error: any) {
        console.error('Error getting proof:', error);
        return res.status(500).json({ 
            error: 'Failed to get proof',
            details: error.message || 'Unknown error'
        });
    }
});

export default router;
