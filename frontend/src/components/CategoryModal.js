import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash, FaEdit, FaSave } from 'react-icons/fa';
import './Modals.css';

const CategoryModal = ({ show, onClose, dataService }) => {
        const [categories, setCategories] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');
        const [newCategoryName, setNewCategoryName] = useState('');
        const [editingCategory, setEditingCategory] = useState(null);
        const [editName, setEditName] = useState('');

        useEffect(() => {
            if (show) {
                loadCategories();
            }
        }, [show]);

        const loadCategories = async() => {
            try {
                setLoading(true);
                setError('');
                const fetchedCategories = await dataService.getCategories();
                setCategories(fetchedCategories);
                setLoading(false);
            } catch (error) {
                console.error('Error loading categories:', error);
                setError('Failed to load categories: ' + error.message);
                setLoading(false);
            }
        };

        const handleAddCategory = async() => {
            if (!newCategoryName.trim()) {
                setError('Category name cannot be empty');
                return;
            }

            try {
                setLoading(true);
                setError('');
                await dataService.addCategory({ name: newCategoryName.trim() });
                setNewCategoryName('');
                await loadCategories();
            } catch (error) {
                console.error('Error adding category:', error);
                setError('Failed to add category: ' + error.message);
                setLoading(false);
            }
        };

        const handleDeleteCategory = async(categoryId) => {
            try {
                setLoading(true);
                setError('');
                await dataService.removeCategory(categoryId);
                await loadCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                setError('Failed to delete category: ' + error.message);
                setLoading(false);
            }
        };

        const startEditing = (category) => {
            setEditingCategory(category);
            setEditName(category.name);
        };

        const cancelEditing = () => {
            setEditingCategory(null);
            setEditName('');
        };

        const handleUpdateCategory = async() => {
            if (!editName.trim()) {
                setError('Category name cannot be empty');
                return;
            }

            try {
                setLoading(true);
                setError('');
                await dataService.updateCategory(editingCategory.id, { name: editName.trim() });
                setEditingCategory(null);
                setEditName('');
                await loadCategories();
            } catch (error) {
                console.error('Error updating category:', error);
                setError('Failed to update category: ' + error.message);
                setLoading(false);
            }
        };

        if (!show) return null;

        return ( <
            div className = "modal" >
            <
            div className = "modal-content" >
            <
            div className = "modal-header" >
            <
            h2 > Manage Categories < /h2> <
            button className = "close-button"
            onClick = { onClose } >
            <
            FaTimes / >
            <
            /button> <
            /div>

            <
            div className = "modal-body" > {
                error && < div className = "error-message" > { error } < /div>}

                <
                div className = "add-category-form" >
                <
                input
                type = "text"
                placeholder = "New category name"
                value = { newCategoryName }
                onChange = {
                    (e) => setNewCategoryName(e.target.value) }
                className = "form-input" /
                >
                <
                button
                className = "btn btn-primary"
                onClick = { handleAddCategory }
                disabled = { loading || !newCategoryName.trim() } >
                <
                FaPlus / > Add Category <
                /button> <
                /div>

                <
                div className = "categories-list" >
                <
                h3 > Existing Categories < /h3>

                {
                    loading ? ( <
                        div className = "loading" > Loading categories... < /div>
                    ) : categories.length === 0 ? ( <
                        div className = "no-categories" > No categories found < /div>
                    ) : ( <
                        ul className = "category-items" > {
                            categories.map(category => ( <
                                li key = { category.id }
                                className = "category-item" > {
                                    editingCategory && editingCategory.id === category.id ? ( <
                                        div className = "category-edit" >
                                        <
                                        input type = "text"
                                        value = { editName }
                                        onChange = {
                                            (e) => setEditName(e.target.value) }
                                        className = "form-input" /
                                        >
                                        <
                                        div className = "category-actions" >
                                        <
                                        button className = "btn btn-success btn-sm"
                                        onClick = { handleUpdateCategory }
                                        disabled = { loading || !editName.trim() } >
                                        <
                                        FaSave / >
                                        <
                                        /button> <
                                        button className = "btn btn-secondary btn-sm"
                                        onClick = { cancelEditing } >
                                        <
                                        FaTimes / >
                                        <
                                        /button> <
                                        /div> <
                                        /div>
                                    ) : ( <
                                        div className = "category-display" >
                                        <
                                        span className = "category-name" > { category.name } < /span> <
                                        div className = "category-actions" >
                                        <
                                        button className = "btn btn-primary btn-sm"
                                        onClick = {
                                            () => startEditing(category) } >
                                        <
                                        FaEdit / >
                                        <
                                        /button> <
                                        button className = "btn btn-danger btn-sm"
                                        onClick = {
                                            () => handleDeleteCategory(category.id) }
                                        disabled = { loading } >
                                        <
                                        FaTrash / >
                                        <
                                        /button> <
                                        /div> <
                                        /div>
                                    )
                                } <
                                /li>
                            ))
                        } <
                        /ul>
                    )
                } <
                /div> <
                /div> <
                /div> <
                /div>
            );
        };

        export default CategoryModal;