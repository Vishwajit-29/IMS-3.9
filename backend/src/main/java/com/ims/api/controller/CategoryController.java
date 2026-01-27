package com.ims.api.controller;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ims.api.model.Category;
import com.ims.api.repository.CategoryRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<?> getAllCategories() {
        try {
            System.out.println("Fetching all categories from MongoDB");
            List<Category> categories = categoryRepository.findAll();
            System.out.println("Found " + categories.size() + " categories in the database");
            
            if (categories.isEmpty()) {
                System.out.println("No categories found in database, initializing default categories");
                // Initialize with default categories if none exist
                categories.add(new Category("Electronics", "/assets/images/categories/electronics.jpg"));
                categories.add(new Category("Furniture", "/assets/images/categories/furniture.jpg"));
                categories.add(new Category("Stationery", "/assets/images/categories/default.jpg"));
                categories.add(new Category("Office Supplies", "/assets/images/categories/office-supplies.jpg"));
                
                categoryRepository.saveAll(categories);
                System.out.println("Default categories created");
            } else {
                for (Category category : categories) {
                    System.out.println("Category: " + category.getName() + ", ID: " + category.getId());
                }
            }
            
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            System.err.println("Error fetching categories from MongoDB: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to retrieve categories: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable String id) {
        try {
            System.out.println("Fetching category with ID: " + id);
        return categoryRepository.findById(id)
                    .map(category -> {
                        System.out.println("Found category: " + category.getName());
                        return ResponseEntity.ok(category);
                    })
                    .orElseGet(() -> {
                        System.out.println("Category not found with ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Error fetching category with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to retrieve category: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createCategory(@Valid @RequestBody Category category) {
        try {
            System.out.println("Creating new category: " + category.getName());
            
        if (categoryRepository.existsByName(category.getName())) {
                System.out.println("Category with name " + category.getName() + " already exists");
                return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("error", "Category with this name already exists"));
            }
            
            Category savedCategory = categoryRepository.save(category);
            System.out.println("Category created successfully with ID: " + savedCategory.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
        } catch (Exception e) {
            System.err.println("Error creating category: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to create category: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable String id, @Valid @RequestBody Category categoryDetails) {
        try {
            System.out.println("Updating category with ID: " + id);
        return categoryRepository.findById(id)
                .map(category -> {
                    category.setName(categoryDetails.getName());
                    category.setImageUrl(categoryDetails.getImageUrl());
                        Category updatedCategory = categoryRepository.save(category);
                        System.out.println("Category updated successfully: " + updatedCategory.getName());
                        return ResponseEntity.ok(updatedCategory);
                    })
                    .orElseGet(() -> {
                        System.out.println("Category not found with ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Error updating category with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to update category: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable String id) {
        try {
            System.out.println("Deleting category with ID: " + id);
        return categoryRepository.findById(id)
                .map(category -> {
                    categoryRepository.delete(category);
                        System.out.println("Category deleted successfully: " + category.getName());
                    return ResponseEntity.ok().build();
                })
                    .orElseGet(() -> {
                        System.out.println("Category not found with ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Error deleting category " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "Failed to delete category: " + e.getMessage()));
        }
    }
} 