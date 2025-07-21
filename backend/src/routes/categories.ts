import express from 'express';
import { Category } from '../models/Category';
import Episode from '../models/Episode';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get all active categories (public)
router.get('/', async (req, res) => {
    try{
        const categories = await Category.find({ isActive: true })
            .select('name icon color episodeCount')
            .sort({ name: 1 });
   
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching public categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all categories for admin (including inactive)
router.get('/admin', authenticate, authorize('admin', 'editor'), async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });
        
        const stats = {
            total: categories.length,
            active: categories.filter(c => c.isActive).length,
            inactive: categories.filter(c => !c.isActive).length,
            totalEpisodes: categories.reduce((sum, cat) => sum + cat.episodeCount, 0)
        };
        
        res.json({ categories, stats });
    } catch (error) {
        console.error('Error fetching admin categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new category
router.post('/', authenticate, authorize('admin', 'editor'), async (req: any, res) => {
    try {
        const { name, description, icon, color } = req.body;
        
        if (!name || !icon || !color) {
            return res.status(400).json({ message: 'Name, icon, and color are required' });
        }
        
        // Check if category already exists (case-insensitive)
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
        });
        
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }
        
        const category = new Category({
            name: name.trim(),
            description: description?.trim(),
            icon,
            color,
            createdBy: req.user.id
        });
        
        await category.save();
        await category.populate('createdBy', 'username email');
        
        res.status(201).json({ category, message: 'Category created successfully' });
    } catch (error: any) {
        console.error('Error creating category:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }
        res.status(500).json({ message: 'Failed to create category', error: error.message });
    }
});

// Update category
router.put('/:id', authenticate, authorize('admin', 'editor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, icon, isActive } = req.body;

        if (!name || !icon || !color) {
            return res.status(400).json({ message: 'Name, icon, and color are required' });
        }
       
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // If changing name, check for duplicates
        if (name && name.trim() !== category.name) {
            const existingCategory = await Category.findOne({ 
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
                _id: { $ne: id }
            });

            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }

            // Update episodes with the old category name to use the new name
            await Episode.updateMany(
                { category: category.name },
                { $set: { category: name.trim() } }
            );
        }

        // Update category
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            {
                name: name?.trim() || category.name,
                description: description?.trim(),
                color: color || category.color,
                icon: icon || category.icon,
                isActive: isActive !== undefined ? isActive : category.isActive
            },
            { new: true, runValidators: true }
        ).populate('createdBy', 'username email');

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Get episode count
        const episodeCount = await Episode.countDocuments({ category: updatedCategory.name });
        (updatedCategory as any).episodeCount = episodeCount;
        await updatedCategory.save();


        res.json({
            message: 'Category updated successfully',
            category: {
                ...updatedCategory.toObject(),
                episodeCount,
            }
        });
    } catch (error: any) {
        console.error('Update category error:', error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Category with this name already exists' });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

// Delete category
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if category is being used by episodes
        const episodeCount = await Episode.countDocuments({ category: category.name });
        if (episodeCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category "${category.name}" because it is used by ${episodeCount} episode(s). Please move or delete those episodes first.`,
                episodeCount
            });
        }

        await Category.findByIdAndDelete(id);

        res.json({ 
            message: `Category "${category.name}" deleted successfully` 
        });
    } catch (error: any) {
        console.error('Delete category error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Toggle category active status
router.patch('/:id/toggle', authenticate, authorize('admin', 'editor'), async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.isActive = !category.isActive;
        await category.save();

        const episodeCount = await Episode.countDocuments({ category: category.name });

        res.json({
            message: `Category "${category.name}" ${category.isActive ? 'activated' : 'deactivated'} successfully`,
            category: {
                ...category.toObject(),
                episodeCount,
            }
        });
    } catch (error: any) {
        console.error('Toggle category error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get category statistics
router.get('/stats/overview', authenticate, authorize('admin', 'editor'), async (req, res) => {
    try {
        const totalCategories = await Category.countDocuments();
        const activeCategories = await Category.countDocuments({ isActive: true });
        const inactiveCategories = await Category.countDocuments({ isActive: false });

        // Get categories with episode counts
        const categoryStats = await Category.aggregate([
            {
                $project: {
                    name: 1,
                    color: 1,
                    icon: 1,
                    isActive: 1,
                    episodeCount: 1
                }
            },
            { $sort: { episodeCount: -1 } }
        ]);

        res.json({
            overview: {
                totalCategories,
                activeCategories,
                inactiveCategories
            },
            categoryStats
        });
    } catch (error: any) {
        console.error('Category stats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
